from typing import List

from core.database import supabase
from core.models import Alert
from core.supabase_helpers import response_data


def get_alerts(company_id: str, unread_only: bool = False) -> List[Alert]:
    try:
        query = supabase.table("alerts").select("*").eq("company_id", company_id).order("created_at", desc=True)
        if unread_only:
            query = query.eq("is_read", False)
        rows = response_data(query.limit(50).execute()) or []
        return [
            Alert(
                id=str(r["id"]),
                company_id=str(r.get("company_id") or company_id),
                supplier_id=str(r["supplier_id"]) if r.get("supplier_id") else None,
                title=r.get("title", "Alert"),
                message=r.get("message"),
                severity=r.get("severity", "medium"),
                is_read=bool(r.get("is_read")),
                created_at=r.get("created_at"),
            )
            for r in rows
        ]
    except Exception:
        return _computed_alerts(company_id)


def _computed_alerts(company_id: str) -> List[Alert]:
    from services.supplier_service import get_supplier_risk

    alerts = []
    for supplier in get_supplier_risk(company_id):
        if (supplier.risk_score or 0) >= 60:
            alerts.append(
                Alert(
                    id=f"computed-{supplier.id}",
                    company_id=company_id,
                    supplier_id=supplier.id,
                    title=f"High risk supplier: {supplier.name}",
                    message=f"Risk score {supplier.risk_score} at {supplier.location or supplier.country}",
                    severity="high" if supplier.risk_score >= 75 else "medium",
                    is_read=False,
                    created_at=None,
                )
            )
    return alerts[:20]


def mark_alert_read(alert_id: str) -> bool:
    try:
        supabase.table("alerts").update({"is_read": True}).eq("id", alert_id).execute()
        return True
    except Exception:
        return alert_id.startswith("computed-")
