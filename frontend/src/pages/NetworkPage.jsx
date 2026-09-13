import { useEffect, useMemo, useState, useCallback } from 'react';
import ForceGraph, { nodeColorForRisk } from '../components/ForceGraph.jsx';
import { fetchGraph, simulateGraph } from '../api/client.js';

const nodeRisk = (n) => n.risk_score ?? n.base_risk ?? n.risk ?? n.score ?? 0;

const NetworkPage = ({ companyId }) => {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [disrupted, setDisrupted] = useState(() => new Set());
  const [sim, setSim] = useState(null);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setDisrupted(new Set());
    setSim(null);
    setSelectedId(null);
    fetchGraph(companyId)
      .then((data) => setGraph(data))
      .catch((err) => setError(err?.response?.data?.detail || err.message || 'Failed to load network'))
      .finally(() => setLoading(false));
  }, [companyId]);

  const nodes = useMemo(() => {
    const raw = graph?.nodes ?? [];
    return raw.map((n) => ({
      id: n.id,
      label: n.label || n.name || n.id,
      type: n.type,
      risk: nodeRisk(n),
    }));
  }, [graph]);

  const links = useMemo(() => {
    const raw = graph?.edges ?? graph?.links ?? [];
    return raw.map((e) => ({
      source: e.source,
      target: e.target,
      relation: e.relation,
    }));
  }, [graph]);

  const companyNodeId = useMemo(() => {
    const c = (graph?.nodes ?? []).find((n) => n.type === 'company');
    return c?.id ?? null;
  }, [graph]);

  // Projected-risk lookup once a simulation has run.
  const projectedMap = useMemo(() => {
    if (!sim?.affected_nodes) return null;
    const m = new Map();
    sim.affected_nodes.forEach((a) => m.set(a.id, a.projected_risk));
    return m;
  }, [sim]);

  const riskFor = useCallback(
    (id) => {
      if (projectedMap && projectedMap.has(id)) return projectedMap.get(id);
      const n = nodes.find((x) => x.id === id);
      return n ? n.risk : 0;
    },
    [projectedMap, nodes],
  );

  const highlightLinks = useMemo(() => {
    const set = new Set();
    (sim?.cascade_edges ?? []).forEach((e) => set.add(`${e.source}>${e.target}`));
    return set;
  }, [sim]);

  const toggleDisrupted = useCallback((node) => {
    const id = typeof node === 'object' ? node.id : node;
    setSelectedId(id);
    setDisrupted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const runSimulation = async () => {
    if (!disrupted.size) return;
    setSimBusy(true);
    setSimError(null);
    try {
      const result = await simulateGraph(companyId, Array.from(disrupted));
      setSim(result);
    } catch (err) {
      setSimError(err?.response?.data?.detail || err.message || 'Simulation failed');
    } finally {
      setSimBusy(false);
    }
  };

  const reset = () => {
    setDisrupted(new Set());
    setSim(null);
    setSimError(null);
    setSelectedId(null);
  };

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const selectedDeps = useMemo(() => {
    if (!selectedId) return [];
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const deps = [];
    links.forEach((l) => {
      if (l.source === selectedId && byId[l.target]) deps.push({ dir: 'out', node: byId[l.target], relation: l.relation });
      if (l.target === selectedId && byId[l.source]) deps.push({ dir: 'in', node: byId[l.source], relation: l.relation });
    });
    return deps;
  }, [selectedId, nodes, links]);

  if (loading) return <div className="page-body loading-state">Loading network graph…</div>;
  if (error) {
    return (
      <div className="page-body error-state">
        <h2 style={{ marginTop: 0 }}>Could not load network</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Network &amp; What-If Simulation</h1>
        <p className="page-sub">
          Click nodes to mark them <strong>disrupted</strong>, then run a cascade simulation across the dependency graph.
        </p>
      </div>

      <div className="network-layout">
        <section className="card network-graph-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 18px 0' }}>
            <h3 className="card-title">Dependency Graph</h3>
            <div className="graph-legend">
              <span><span className="dot" style={{ background: '#38bdf8' }} /> Company</span>
              <span><span className="dot" style={{ background: nodeColorForRisk(20) }} /> Low</span>
              <span><span className="dot" style={{ background: nodeColorForRisk(50) }} /> Med</span>
              <span><span className="dot" style={{ background: nodeColorForRisk(80) }} /> High</span>
            </div>
          </div>
          {nodes.length ? (
            <ForceGraph
              nodes={nodes}
              links={links}
              riskFor={riskFor}
              companyNodeId={companyNodeId}
              disruptedIds={disrupted}
              highlightLinks={highlightLinks}
              selectedId={selectedId}
              onNodeClick={toggleDisrupted}
            />
          ) : (
            <div className="empty-state">No graph nodes for this company.</div>
          )}
        </section>

        <aside className="network-side">
          <section className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>What-If Simulation</h3>
            <div className="sim-controls">
              <div className="sim-count">
                <span className="mono big">{disrupted.size}</span>
                <span className="muted"> node{disrupted.size === 1 ? '' : 's'} marked disrupted</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: 0 }}
                  disabled={!disrupted.size || simBusy}
                  onClick={runSimulation}
                >
                  {simBusy ? 'Simulating…' : 'Run simulation'}
                </button>
                <button type="button" className="btn-ghost" onClick={reset} disabled={!disrupted.size && !sim}>
                  Resolve / Reset
                </button>
              </div>
              {simError && <div className="auth-error" style={{ marginTop: 8 }}>{simError}</div>}
            </div>

            {sim && (
              <div className="sim-summary">
                <div className="sim-metric">
                  <span className="mono big danger">{sim.nodes_affected}</span>
                  <span className="muted">nodes affected</span>
                </div>
                <div className="sim-metric">
                  <span className="mono big warning">{sim.critical_paths_broken}</span>
                  <span className="muted">critical paths broken</span>
                </div>
                <div className="sim-risk-delta">
                  <span className="muted">Network risk</span>
                  <div className="delta-row">
                    <span className="mono">{Math.round(sim.overall_risk_before)}</span>
                    <span className="arrow">→</span>
                    <span
                      className="mono big"
                      style={{ color: nodeColorForRisk(sim.overall_risk_after) }}
                    >
                      {Math.round(sim.overall_risk_after)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>Node Details</h3>
            {selectedNode ? (
              <div>
                <div className="node-detail-head">
                  <div>
                    <div style={{ fontWeight: 700 }}>{selectedNode.label}</div>
                    <div className="muted" style={{ fontSize: '0.78rem' }}>
                      {selectedNode.type || 'node'}
                      {disrupted.has(selectedNode.id) ? ' · disrupted' : ''}
                    </div>
                  </div>
                  <span
                    className="mono big"
                    style={{ color: nodeColorForRisk(riskFor(selectedNode.id)) }}
                  >
                    {Math.round(riskFor(selectedNode.id))}
                  </span>
                </div>
                <div className="dep-list">
                  <div className="dep-title">Direct dependencies</div>
                  {selectedDeps.length ? (
                    selectedDeps.map((d, i) => (
                      <div key={`${d.node.id}-${i}`} className="dep-row">
                        <span className={`dep-dir ${d.dir}`}>{d.dir === 'out' ? '→' : '←'}</span>
                        <span style={{ flex: 1 }}>{d.node.label}</span>
                        <span className="mono" style={{ color: nodeColorForRisk(riskFor(d.node.id)) }}>
                          {Math.round(riskFor(d.node.id))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="muted" style={{ fontSize: '0.82rem' }}>No direct dependencies.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="muted" style={{ fontSize: '0.85rem' }}>Click a node to inspect it and toggle its disruption state.</div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default NetworkPage;
