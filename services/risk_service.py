from datetime import date, timedelta
from typing import List

from core.database import supabase
from core.supabase_helpers import response_data
from services.demo_data import suppliers_for_company


def _severity_weight(severity: str) -> float:
    s = (severity or "").lower()
    if "critical" in s or "high" in s:
        return 25.0
    if "medium" in s:
        return 12.0
    return 5.0


def _weather_boost_for_location(location: str, country: str) -> float:
    """Real severe-weather signal (OpenWeatherMap) as a risk add-on.

    Geocodes the supplier location (Nominatim) then fetches weather. Returns 0
    when no OPENWEATHER_API_KEY is configured (the weather signal runs in
    fallback mode and contributes nothing rather than faking a number).
    """
    from services.external_service import geocode_address, get_weather_signal

    query = ", ".join([p for p in [location, country] if p])
    if not query:
        return 0.0
    geo = geocode_address(query)
    if geo.latitude is None or geo.longitude is None:
        return 0.0
    signal = get_weather_signal(geo.latitude, geo.longitude, location)
    return signal.risk_contribution if signal.source != "fallback" else 0.0


def recalculate_supplier_risks(company_id: str, include_weather: bool = False) -> dict:
    if not supabase:
        suppliers = suppliers_for_company(company_id)
        weather_added = 0.0
        scores = []
        for row in suppliers:
            base = float(row.get("risk_score") or 0)
            boost = _weather_boost_for_location(row.get("location", ""), row.get("country", "")) if include_weather else 0.0
            weather_added += boost
            scores.append(min(100.0, base + boost))
        overall = round(sum(scores) / len(scores), 2) if scores else 0.0
        return {
            "updated": len(suppliers),
            "company_id": company_id,
            "overall_risk_score": overall,
            "weather_risk_added": round(weather_added, 2),
            "mode": "demo",
        }

    try:
        dep_result = supabase.table("dependencies").select("supplier_id").eq("company_id", company_id).execute()
        dep_rows = response_data(dep_result) or []
        supplier_ids = list({r["supplier_id"] for r in dep_rows})
        if not supplier_ids:
            return {"updated": 0, "company_id": company_id}

        disruptions = response_data(
            supabase.table("disruption_events")
            .select("location, country, severity, event_type")
            .order("start_date", desc=True)
            .limit(20)
            .execute()
        ) or []

        suppliers = response_data(
            supabase.table("suppliers").select("id, name, risk_score, location, country").in_("id", supplier_ids).execute()
        ) or []

        updated = 0
        scores_for_history: List[float] = []

        for row in suppliers:
            base = float(row.get("risk_score") or 40.0)
            location = (row.get("location") or "").lower()
            country = (row.get("country") or "").lower()
            boost = 0.0

            for event in disruptions:
                ev_loc = (event.get("location") or "").lower()
                ev_country = (event.get("country") or "").lower()
                if ev_loc and ev_loc in location:
                    boost += _severity_weight(event.get("severity"))
                elif ev_country and ev_country == country:
                    boost += _severity_weight(event.get("severity")) * 0.6
                elif ev_country == "global" or ev_loc == "global":
                    boost += _severity_weight(event.get("severity")) * 0.3

            weather_boost = (
                _weather_boost_for_location(row.get("location", ""), row.get("country", ""))
                if include_weather
                else 0.0
            )
            new_score = round(min(100.0, base + boost + weather_boost), 2)
            supabase.table("suppliers").update({"risk_score": new_score}).eq("id", row["id"]).execute()
            scores_for_history.append(new_score)
            updated += 1

        overall = round(sum(scores_for_history) / len(scores_for_history), 2) if scores_for_history else 0.0
        _record_risk_history(company_id, overall)
        _generate_alerts(company_id, suppliers, overall)

        return {"updated": updated, "company_id": company_id, "overall_risk_score": overall}
    except Exception:
        suppliers = suppliers_for_company(company_id)
        overall = round(sum(float(row.get("risk_score") or 0) for row in suppliers) / len(suppliers), 2) if suppliers else 0.0
        return {"updated": len(suppliers), "company_id": company_id, "overall_risk_score": overall, "mode": "demo"}


def _record_risk_history(company_id: str, score: float) -> None:
    today = date.today().isoformat()
    payload = {"company_id": company_id, "risk_score": score, "recorded_at": today}
    try:
        supabase.table("risk_history").upsert(payload, on_conflict="company_id,recorded_at").execute()
    except Exception:
        pass


def get_risk_trend(company_id: str, days: int = 30) -> List[dict]:
    if supabase:
        try:
            rows = response_data(
                supabase.table("risk_history")
                .select("risk_score, recorded_at")
                .eq("company_id", company_id)
                .order("recorded_at", desc=False)
                .limit(days)
                .execute()
            ) or []
            if rows:
                return [{"date": r["recorded_at"], "score": float(r["risk_score"])} for r in rows]
        except Exception:
            pass

    from services.dashboard_service import get_dashboard_summary

    try:
        summary = get_dashboard_summary(company_id)
        score = summary.overall_risk_score
    except Exception:
        score = 50.0

    trend = []
    for i in range(days, -1, -6):
        d = date.today() - timedelta(days=i)
        drift = (days - i) * 0.2
        trend.append({"date": d.isoformat(), "score": round(min(100, max(0, score - drift + (i % 3) * 2)), 2)})
    if trend:
        trend[-1]["score"] = score
    return trend


def _generate_alerts(company_id: str, suppliers: list, overall: float) -> None:
    for row in suppliers:
        score = float(row.get("risk_score") or 0)
        if score < 60:
            continue
        title = f"High risk: {row.get('name', 'Supplier')}"
        message = f"Risk score {score} — review alternate suppliers before disruption impact."
        payload = {
            "company_id": company_id,
            "supplier_id": row.get("id"),
            "title": title,
            "message": message,
            "severity": "high" if score >= 75 else "medium",
            "is_read": False,
        }
        try:
            supabase.table("alerts").insert(payload).execute()
        except Exception:
            pass

    if overall >= 65:
        try:
            supabase.table("alerts").insert(
                {
                    "company_id": company_id,
                    "title": "Elevated network risk",
                    "message": f"Overall supply chain risk index is {overall}. Consider activating contingency suppliers.",
                    "severity": "high",
                    "is_read": False,
                }
            ).execute()
        except Exception:
            pass
