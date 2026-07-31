from typing import Dict, List, Optional, Set

import networkx as nx

from core.database import supabase
from core.models import (
    AffectedNode,
    GraphData,
    GraphEdge,
    GraphNode,
    SimulationResult,
)
from core.supabase_helpers import response_data
from services.demo_data import alternatives_for_company, find_company, suppliers_for_company

# Base risk shock applied at a directly-disrupted node before decay.
_DISRUPTION_SHOCK = 55.0
# A node whose projected risk reaches this is considered "critical".
_CRITICAL_THRESHOLD = 70.0


def get_graph_data(company_id: str, max_tier: int = 4) -> GraphData:
    if not supabase:
        return _demo_graph_data(company_id)

    try:
        company_result = supabase.table("companies").select("id, name").eq("id", company_id).limit(1).execute()
        company_rows = response_data(company_result) or []
        if not company_rows:
            return _demo_graph_data(company_id)

        company_row = company_rows[0]
        dep_rows = response_data(
            supabase.table("dependencies")
            .select("supplier_id, is_primary, is_alternate")
            .eq("company_id", company_id)
            .execute()
        ) or []

        tier1_ids = list({row["supplier_id"] for row in dep_rows})
        if not tier1_ids:
            return _demo_graph_data(company_id)

        all_supplier_ids: Set[str] = set(tier1_ids)
        tier_links: List[dict] = []

        try:
            tier_links = response_data(
                supabase.table("supplier_dependencies")
                .select("parent_supplier_id, child_supplier_id, tier")
                .in_("parent_supplier_id", tier1_ids)
                .execute()
            ) or []
            for link in tier_links:
                all_supplier_ids.add(link["child_supplier_id"])
        except Exception:
            tier_links = _synthetic_tier_links(tier1_ids, max_tier=max_tier - 1)
            for link in tier_links:
                all_supplier_ids.add(link["child_supplier_id"])

        supplier_rows = response_data(
            supabase.table("suppliers")
            .select("id, name, risk_score, country, location")
            .in_("id", list(all_supplier_ids))
            .execute()
        ) or []
        supplier_map = {r["id"]: r for r in supplier_rows}

        nodes: List[GraphNode] = [
            GraphNode(
                id=company_id,
                label=company_row.get("name", "Company"),
                type="company",
                risk_score=None,
            )
        ]
        edges: List[GraphEdge] = []

        for sid in tier1_ids:
            row = supplier_map.get(sid, {})
            nodes.append(
                GraphNode(
                    id=sid,
                    label=row.get("name", "Supplier"),
                    type="supplier",
                    risk_score=float(row.get("risk_score") or 0.0),
                )
            )
            rel = "primary"
            for dep in dep_rows:
                if dep["supplier_id"] == sid:
                    rel = "primary" if dep.get("is_primary") else "alternate"
                    break
            edges.append(GraphEdge(source=company_id, target=sid, relation=rel))

        seen_edges = {(e.source, e.target) for e in edges}
        for link in tier_links:
            parent = link["parent_supplier_id"]
            child = link["child_supplier_id"]
            if child not in supplier_map:
                continue
            if child not in [n.id for n in nodes]:
                row = supplier_map[child]
                nodes.append(
                    GraphNode(
                        id=child,
                        label=row.get("name", "Sub-supplier"),
                        type="supplier",
                        risk_score=float(row.get("risk_score") or 0.0),
                    )
                )
            key = (parent, child)
            if key not in seen_edges:
                tier = link.get("tier", 2)
                edges.append(GraphEdge(source=parent, target=child, relation=f"tier_{tier}"))
                seen_edges.add(key)

        return GraphData(nodes=nodes, edges=edges)
    except Exception:
        return _demo_graph_data(company_id)


def simulate_disruption(
    company_id: str,
    disrupted_node_ids: List[str],
    decay: float = 0.55,
) -> SimulationResult:
    """What-If engine.

    Builds a directed graph of the company's network, then propagates a risk
    shock *upstream* from each disrupted node (a supplier's failure hurts every
    node that depends on it). Impact decays by `decay` per hop.
    """
    graph = get_graph_data(company_id)
    node_by_id = {n.id: n for n in graph.nodes}
    disrupted = [nid for nid in disrupted_node_ids if nid in node_by_id]

    # Directed graph following "depends_on": edge source depends on target.
    # Impact therefore flows target -> source, so we traverse the REVERSED graph.
    g = nx.DiGraph()
    for n in graph.nodes:
        g.add_node(n.id)
    for e in graph.edges:
        g.add_edge(e.source, e.target)
    rg = g.reverse(copy=False)

    base_risk = {n.id: float(n.risk_score or 0.0) for n in graph.nodes}
    overall_before = _network_overall(base_risk, node_by_id)

    if not disrupted:
        return SimulationResult(
            company_id=company_id,
            disrupted_node_ids=[],
            affected_nodes=[],
            cascade_edges=[],
            nodes_affected=0,
            critical_paths_broken=0,
            overall_risk_before=overall_before,
            overall_risk_after=overall_before,
        )

    # Shortest hop distance from ANY disrupted node, over reversed edges.
    best_distance: Dict[str, int] = {}
    for src in disrupted:
        lengths = nx.single_source_shortest_path_length(rg, src)
        for target, dist in lengths.items():
            if target not in best_distance or dist < best_distance[target]:
                best_distance[target] = dist

    added: Dict[str, float] = {}
    for node_id, dist in best_distance.items():
        added[node_id] = round(_DISRUPTION_SHOCK * (decay ** dist), 2)

    cascade_edges: List[GraphEdge] = []
    for e in graph.edges:
        # An edge is part of the cascade if impact actually travels along it,
        # i.e. the target (dependency) is impacted and closer to a disrupted
        # source than the dependent node.
        if e.target in best_distance and e.source in best_distance:
            if best_distance[e.target] < best_distance[e.source]:
                cascade_edges.append(e)

    affected: List[AffectedNode] = []
    projected: Dict[str, float] = dict(base_risk)
    critical_paths = 0
    for node_id, add in added.items():
        node = node_by_id[node_id]
        base = base_risk.get(node_id, 0.0)
        proj = round(min(100.0, base + add), 2)
        projected[node_id] = proj
        affected.append(
            AffectedNode(
                id=node_id,
                label=node.label,
                base_risk=base,
                added_risk=add,
                projected_risk=proj,
                distance=best_distance[node_id],
            )
        )
        # A "critical path broken" = a company-facing (tier-1) dependency that
        # crosses the critical threshold under the simulation.
        if proj >= _CRITICAL_THRESHOLD and g.has_edge(company_id, node_id):
            critical_paths += 1

    affected.sort(key=lambda a: (a.distance, -a.projected_risk))
    overall_after = _network_overall(projected, node_by_id)

    return SimulationResult(
        company_id=company_id,
        disrupted_node_ids=disrupted,
        affected_nodes=affected,
        cascade_edges=cascade_edges,
        nodes_affected=len(affected),
        critical_paths_broken=critical_paths,
        overall_risk_before=overall_before,
        overall_risk_after=overall_after,
    )


def _network_overall(scores: Dict[str, float], node_by_id: Dict[str, GraphNode]) -> float:
    supplier_scores = [
        scores.get(nid, 0.0) for nid, n in node_by_id.items() if n.type == "supplier"
    ]
    if not supplier_scores:
        return 0.0
    return round(sum(supplier_scores) / len(supplier_scores), 2)


def _synthetic_tier_links(tier1_ids: List[str], max_tier: int = 3) -> List[dict]:
    """Build tier-2/3 links from other suppliers in same DB when supplier_dependencies is empty."""
    rows = response_data(
        supabase.table("suppliers").select("id, country, risk_score").limit(80).execute()
    ) or []
    by_country: Dict[str, List[str]] = {}
    for row in rows:
        country = (row.get("country") or "global").lower()
        by_country.setdefault(country, []).append(row["id"])

    links = []
    for parent in tier1_ids:
        parent_row = next((r for r in rows if r["id"] == parent), None)
        if not parent_row:
            continue
        country = (parent_row.get("country") or "global").lower()
        candidates = [cid for cid in by_country.get(country, []) if cid != parent][:2]
        for idx, child in enumerate(candidates):
            links.append({"parent_supplier_id": parent, "child_supplier_id": child, "tier": 2 + (idx % max_tier)})
    return links


def _demo_graph_data(company_id: str) -> GraphData:
    company = find_company(company_id)
    if not company:
        return GraphData(nodes=[], edges=[])

    primary_suppliers = suppliers_for_company(company_id)
    alternate_ids = {supplier["id"] for supplier in alternatives_for_company(company_id)}
    nodes: List[GraphNode] = [
        GraphNode(id=company_id, label=company["name"], type="company"),
    ]
    edges: List[GraphEdge] = []

    for supplier in primary_suppliers:
        nodes.append(
            GraphNode(
                id=supplier["id"],
                label=supplier["name"],
                type="supplier",
                risk_score=float(supplier.get("risk_score") or 0),
            )
        )
        relation = "alternate" if supplier["id"] in alternate_ids else "primary"
        edges.append(GraphEdge(source=company_id, target=supplier["id"], relation=relation))

    for idx, supplier in enumerate(primary_suppliers[:2]):
        child_id = f"{supplier['id']}-tier2"
        nodes.append(
            GraphNode(
                id=child_id,
                label=f"{supplier['location']} Raw Materials",
                type="supplier",
                risk_score=max(20, float(supplier.get("risk_score") or 0) - 12),
            )
        )
        edges.append(GraphEdge(source=supplier["id"], target=child_id, relation=f"tier_{2 + idx}"))

    return GraphData(nodes=nodes, edges=edges)
