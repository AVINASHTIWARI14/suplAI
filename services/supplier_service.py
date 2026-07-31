from typing import List, Optional
from uuid import uuid4

from core.database import supabase
from core.models import SupplierAlternative, SupplierCreate, SupplierRisk, SupplierUpdate
from core.supabase_helpers import response_data
from services.demo_data import (
    ALTERNATIVES,
    DEPENDENCIES,
    SUPPLIERS,
    alternatives_for_company,
    composite_score,
    suppliers_for_company,
)


def _demo_supplier_to_risk(row: dict) -> SupplierRisk:
    return SupplierRisk(
        id=row["id"],
        name=row["name"],
        risk_score=float(row.get("risk_score") or 0),
        location=row.get("location"),
        country=row.get("country"),
        cost_index=row.get("cost_index"),
        rating=row.get("rating"),
        lead_time_days=row.get("lead_time_days"),
        latitude=row.get("latitude"),
        longitude=row.get("longitude"),
    )


def create_supplier(payload: SupplierCreate) -> SupplierRisk:
    """Create a supplier and attach it to a company.

    Tries Supabase first; if Supabase is not configured OR unreachable, falls
    back to an in-memory demo mutation so the app stays fully usable offline.
    """
    if supabase:
        try:
            new_id = str(uuid4())
            supabase.table("suppliers").insert({
                "id": new_id,
                "name": payload.name,
                "risk_score": payload.risk_score,
                "location": payload.location,
                "country": payload.country,
                "cost_index": payload.cost_index,
                "rating": payload.rating,
                "latitude": payload.latitude,
                "longitude": payload.longitude,
            }).execute()
            supabase.table("dependencies").insert({
                "company_id": payload.company_id,
                "supplier_id": new_id,
                "is_primary": not payload.is_alternate,
                "is_alternate": payload.is_alternate,
                "lead_time_days": payload.lead_time_days,
            }).execute()
            return SupplierRisk(id=new_id, name=payload.name, risk_score=payload.risk_score,
                                location=payload.location, country=payload.country,
                                cost_index=payload.cost_index, rating=payload.rating,
                                lead_time_days=payload.lead_time_days,
                                latitude=payload.latitude, longitude=payload.longitude)
        except Exception:
            pass  # fall through to demo mutation

    new_id = f"sup-{uuid4().hex[:8]}"
    row = {
        "id": new_id,
        "name": payload.name,
        "risk_score": payload.risk_score,
        "location": payload.location,
        "country": payload.country,
        "cost_index": payload.cost_index,
        "rating": payload.rating,
        "lead_time_days": payload.lead_time_days,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
    }
    SUPPLIERS.append(row)
    DEPENDENCIES.setdefault(payload.company_id, []).append(new_id)
    if payload.is_alternate:
        ALTERNATIVES.setdefault(payload.company_id, []).append(new_id)
    return _demo_supplier_to_risk(row)


def update_supplier(supplier_id: str, payload: SupplierUpdate) -> SupplierRisk:
    changes = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not changes:
        raise ValueError("No fields to update")
    if supabase:
        try:
            supabase.table("suppliers").update(changes).eq("id", supplier_id).execute()
            rows = response_data(
                supabase.table("suppliers").select("*").eq("id", supplier_id).limit(1).execute()
            ) or []
            if rows:
                return _demo_supplier_to_risk(rows[0])
        except Exception:
            pass  # fall through to demo mutation

    row = next((s for s in SUPPLIERS if s["id"] == supplier_id), None)
    if not row:
        raise ValueError("Supplier not found")
    row.update(changes)
    return _demo_supplier_to_risk(row)


def delete_supplier(supplier_id: str) -> dict:
    if supabase:
        try:
            supabase.table("dependencies").delete().eq("supplier_id", supplier_id).execute()
            res = supabase.table("suppliers").delete().eq("id", supplier_id).execute()
            if response_data(res):
                return {"deleted": supplier_id}
        except Exception:
            pass  # fall through to demo mutation

    global_removed = False
    for i, s in enumerate(list(SUPPLIERS)):
        if s["id"] == supplier_id:
            SUPPLIERS.pop(i)
            global_removed = True
            break
    if not global_removed:
        raise ValueError("Supplier not found")
    for ids in DEPENDENCIES.values():
        if supplier_id in ids:
            ids.remove(supplier_id)
    for ids in ALTERNATIVES.values():
        if supplier_id in ids:
            ids.remove(supplier_id)
    return {"deleted": supplier_id}


def import_suppliers_csv(csv_text: str, company_id: str) -> dict:
    """Bulk-import suppliers from CSV text with per-row validation.

    Expected header columns (case-insensitive): name (required), location,
    country, risk_score, cost_index, rating, lead_time_days, latitude,
    longitude, is_alternate. Bad rows are reported, good rows imported.
    """
    import csv
    import io

    from pydantic import ValidationError

    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames or "name" not in [f.strip().lower() for f in reader.fieldnames]:
        raise ValueError("CSV must include a 'name' column")

    imported, failed, errors, created_ids = 0, 0, [], []
    for idx, raw in enumerate(reader, start=2):  # row 1 is the header
        row = {(k or "").strip().lower(): (v.strip() if isinstance(v, str) else v) for k, v in raw.items()}
        if not row.get("name"):
            failed += 1
            errors.append({"row": idx, "error": "missing name"})
            continue
        try:
            def _num(key):
                val = row.get(key)
                return float(val) if val not in (None, "") else None

            def _int(key):
                val = row.get(key)
                return int(float(val)) if val not in (None, "") else None

            payload = SupplierCreate(
                name=row["name"],
                company_id=company_id,
                location=row.get("location") or None,
                country=row.get("country") or None,
                risk_score=_num("risk_score") if row.get("risk_score") else 40.0,
                cost_index=_num("cost_index"),
                rating=_num("rating"),
                lead_time_days=_int("lead_time_days"),
                latitude=_num("latitude"),
                longitude=_num("longitude"),
                is_alternate=str(row.get("is_alternate", "")).lower() in ("1", "true", "yes"),
            )
            created = create_supplier(payload)
            created_ids.append(created.id)
            imported += 1
        except (ValidationError, ValueError, TypeError) as exc:
            failed += 1
            errors.append({"row": idx, "error": str(exc)[:200]})

    return {"imported": imported, "failed": failed, "errors": errors, "created_ids": created_ids}


def get_supplier_risk(company_id: str) -> List[SupplierRisk]:
    if not supabase:
        return [
            SupplierRisk(
                id=row["id"],
                name=row["name"],
                risk_score=float(row["risk_score"]),
                location=row.get("location"),
                country=row.get("country"),
                cost_index=row.get("cost_index"),
                rating=row.get("rating"),
                lead_time_days=row.get("lead_time_days"),
            )
            for row in sorted(suppliers_for_company(company_id), key=lambda item: item["risk_score"], reverse=True)
        ]

    try:
        dep_rows = response_data(
            supabase.table("dependencies")
            .select("supplier_id")
            .eq("company_id", company_id)
            .execute()
        ) or []
        supplier_ids = list({row.get("supplier_id") for row in dep_rows if row.get("supplier_id")})
        if not supplier_ids:
            return []

        rows = response_data(
            supabase.table("suppliers")
            .select("id, name, risk_score, location, country")
            .in_("id", supplier_ids)
            .order("risk_score", desc=True)
            .execute()
        ) or []

        dep_details = response_data(
            supabase.table("dependencies")
            .select("supplier_id, lead_time_days")
            .eq("company_id", company_id)
            .execute()
        ) or []
        lead_map = {d["supplier_id"]: d.get("lead_time_days") for d in dep_details}

        return [
            SupplierRisk(
                id=row["id"],
                name=row.get("name", "Unknown"),
                risk_score=float(row.get("risk_score") or 0.0),
                location=row.get("location"),
                country=row.get("country"),
                lead_time_days=lead_map.get(row["id"]),
            )
            for row in rows
        ]
    except Exception:
        return get_supplier_risk_demo(company_id)


def get_supplier_alternatives(company_id: str) -> List[SupplierAlternative]:
    if not supabase:
        return get_supplier_alternatives_demo(company_id)

    try:
        dep_rows = response_data(
            supabase.table("dependencies")
            .select("supplier_id")
            .eq("company_id", company_id)
            .eq("is_alternate", True)
            .execute()
        ) or []
        supplier_ids = list({row.get("supplier_id") for row in dep_rows if row.get("supplier_id")})
        if not supplier_ids:
            return []

        rows = response_data(
            supabase.table("suppliers")
            .select("id, name, cost_index, rating, risk_score, location, country")
            .in_("id", supplier_ids)
            .execute()
        ) or []

        dep_details = response_data(
            supabase.table("dependencies")
            .select("supplier_id, lead_time_days, cost_per_unit")
            .eq("company_id", company_id)
            .eq("is_alternate", True)
            .execute()
        ) or []
        dep_map = {d["supplier_id"]: d for d in dep_details}

        def composite(row, dep):
            cost = float(row.get("cost_index") or 50.0)
            risk = float(row.get("risk_score") or 50.0)
            lead = float(dep.get("lead_time_days") or 30)
            rating = float(row.get("rating") or 3.0)
            return round((100 - risk) * 0.4 + rating * 10 * 0.3 + (100 - cost) * 0.2 + (60 - lead) * 0.1, 2)

        alternatives = [
            SupplierAlternative(
                id=row["id"],
                name=row.get("name", "Unknown"),
                cost_index=float(row.get("cost_index") or 0.0),
                lead_time_days=dep_map.get(row["id"], {}).get("lead_time_days"),
                risk_score=float(row.get("risk_score") or 0.0),
                rating=float(row.get("rating") or 0.0),
                location=row.get("location"),
                country=row.get("country"),
                composite_score=composite(row, dep_map.get(row["id"], {})),
            )
            for row in rows
        ]
        return sorted(alternatives, key=lambda x: x.composite_score, reverse=True)
    except Exception:
        return get_supplier_alternatives_demo(company_id)


def get_supplier_risk_demo(company_id: str) -> List[SupplierRisk]:
    return [
        SupplierRisk(
            id=row["id"],
            name=row["name"],
            risk_score=float(row["risk_score"]),
            location=row.get("location"),
            country=row.get("country"),
            cost_index=row.get("cost_index"),
            rating=row.get("rating"),
            lead_time_days=row.get("lead_time_days"),
        )
        for row in sorted(suppliers_for_company(company_id), key=lambda item: item["risk_score"], reverse=True)
    ]


def get_supplier_alternatives_demo(company_id: str) -> List[SupplierAlternative]:
    return [
        SupplierAlternative(
            id=row["id"],
            name=row["name"],
            cost_index=float(row.get("cost_index") or 0),
            lead_time_days=row.get("lead_time_days"),
            risk_score=float(row.get("risk_score") or 0),
            rating=float(row.get("rating") or 0),
            location=row.get("location"),
            country=row.get("country"),
            composite_score=composite_score(row),
        )
        for row in sorted(alternatives_for_company(company_id), key=composite_score, reverse=True)
    ]
