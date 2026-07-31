from core.database import supabase
from core.models import DashboardSummary, DisruptionEvent, SupplierRisk
from core.supabase_helpers import response_data
from services.demo_data import DISRUPTIONS, find_company, suppliers_for_company


def get_dashboard_summary(company_id: str) -> DashboardSummary:
    if not supabase:
        return _demo_dashboard_summary(company_id)

    try:
        company_result = supabase.table("companies").select("id").eq("id", company_id).limit(1).execute()
        company_rows = response_data(company_result) or []
        if not company_rows:
            raise ValueError("Company not found")

        # Get suppliers via dependencies table
        dep_rows = response_data(
            supabase.table("dependencies")
            .select("supplier_id")
            .eq("company_id", company_id)
            .execute()
        ) or []
        supplier_ids = list({row.get("supplier_id") for row in dep_rows if row.get("supplier_id")})

        supplier_risks = []
        if supplier_ids:
            supplier_rows = response_data(
                supabase.table("suppliers")
                .select("id, name, risk_score, location, country")
                .in_("id", supplier_ids)
                .execute()
            ) or []
            supplier_risks = [
                SupplierRisk(
                    id=row["id"],
                    name=row.get("name", "Unknown"),
                    risk_score=float(row.get("risk_score") or 0.0),
                    location=row.get("location"),
                    country=row.get("country"),
                )
                for row in supplier_rows
                if row.get("id")
            ]

        overall_risk = (
            round(sum(item.risk_score for item in supplier_risks) / len(supplier_risks), 2)
            if supplier_risks
            else 0.0
        )
        top_risky_suppliers = sorted(supplier_risks, key=lambda x: x.risk_score, reverse=True)[:3]

        # Get disruptions
        disruption_rows = response_data(
            supabase.table("disruption_events")
            .select("id, location, country, event_type, severity, affected_industry, start_date, source_url")
            .order("start_date", desc=True)
            .limit(5)
            .execute()
        ) or []
        active_disruptions = [
            DisruptionEvent(
                id=row["id"],
                location=row.get("location"),
                country=row.get("country"),
                event_type=row.get("event_type"),
                severity=row.get("severity"),
                affected_industry=row.get("affected_industry"),
                start_date=row.get("start_date"),
                source_url=row.get("source_url"),
            )
            for row in disruption_rows
        ]

        return DashboardSummary(
            company_id=company_id,
            overall_risk_score=overall_risk,
            top_risky_suppliers=top_risky_suppliers,
            active_disruptions=active_disruptions,
        )
    except ValueError:
        raise
    except Exception:
        return _demo_dashboard_summary(company_id)


def _demo_dashboard_summary(company_id: str) -> DashboardSummary:
    if not find_company(company_id):
        raise ValueError("Company not found")

    supplier_risks = [
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
        for row in suppliers_for_company(company_id)
    ]
    overall_risk = round(sum(item.risk_score for item in supplier_risks) / len(supplier_risks), 2) if supplier_risks else 0.0
    return DashboardSummary(
        company_id=company_id,
        overall_risk_score=overall_risk,
        top_risky_suppliers=sorted(supplier_risks, key=lambda x: x.risk_score, reverse=True)[:3],
        active_disruptions=[DisruptionEvent(**row) for row in DISRUPTIONS[:5]],
    )
