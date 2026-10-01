from typing import List

from core.database import supabase
from core.models import Alert
from core.supabase_helpers import response_data


def get_alerts(
    company_id: str,
    unread_only: bool = False,
) -> List[Alert]:
    """
    Get alerts for a company.

    If persisted alerts exist in Supabase, return them.
    If the table is empty, generate alerts directly from the
    latest supplier risk scores.
    """

    try:
        query = (
            supabase
            .table("alerts")
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
        )

        if unread_only:
            query = query.eq("is_read", False)

        rows = response_data(
            query.limit(50).execute()
        ) or []

        # -----------------------------------------------------
        # IMPORTANT:
        # An empty result is NOT an error.
        #
        # We still need to generate alerts from supplier risk.
        # -----------------------------------------------------

        if not rows:
            return _computed_alerts(company_id)

        return [
            Alert(
                id=str(row["id"]),

                company_id=str(
                    row.get("company_id") or company_id
                ),

                supplier_id=(
                    str(row["supplier_id"])
                    if row.get("supplier_id")
                    else None
                ),

                title=row.get(
                    "title",
                    "Alert",
                ),

                message=row.get(
                    "message"
                ),

                severity=row.get(
                    "severity",
                    "medium",
                ),

                is_read=bool(
                    row.get("is_read")
                ),

                created_at=row.get(
                    "created_at"
                ),
            )

            for row in rows
        ]

    except Exception:
        # If Supabase itself fails, still try to show
        # useful risk-based alerts.
        return _computed_alerts(company_id)


def _computed_alerts(
    company_id: str,
) -> List[Alert]:
    """
    Generate live alerts from supplier risk scores.

    This is used when there are no persisted alerts yet.
    """

    from services.supplier_service import (
        get_supplier_risk,
    )

    alerts: List[Alert] = []

    suppliers = get_supplier_risk(
        company_id
    )

    for supplier in suppliers:

        score = float(
            supplier.risk_score or 0
        )

        # Only create alerts for risky suppliers.
        if score < 60:
            continue

        location = (
            supplier.location
            or supplier.country
            or "unknown location"
        )

        severity = (
            "high"
            if score >= 75
            else "medium"
        )

        alerts.append(
            Alert(
                id=f"computed-{supplier.id}",

                company_id=company_id,

                supplier_id=supplier.id,

                title=(
                    f"High risk supplier: "
                    f"{supplier.name}"
                ),

                message=(
                    f"Risk score {score:g} "
                    f"at {location}"
                ),

                severity=severity,

                is_read=False,

                created_at=None,
            )
        )

    return alerts[:20]


def mark_alert_read(
    alert_id: str,
) -> bool:
    """
    Mark a persisted alert as read.

    Computed alerts are temporary, so they don't need
    to be stored in the database.
    """

    try:

        supabase \
            .table("alerts") \
            .update({
                "is_read": True
            }) \
            .eq(
                "id",
                alert_id,
            ) \
            .execute()

        return True

    except Exception:

        return alert_id.startswith(
            "computed-"
        )