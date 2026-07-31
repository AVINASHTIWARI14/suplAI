from typing import List
from core.database import supabase
from core.supabase_helpers import response_data
from services.demo_data import DISRUPTIONS

def get_active_disruptions() -> list:
    if not supabase:
        return DISRUPTIONS

    try:
        rows = response_data(
            supabase.table("disruption_events")
            .select("id, location, country, event_type, severity, affected_industry, start_date, source_url")
            .order("start_date", desc=True)
            .limit(10)
            .execute()
        ) or []
        return rows
    except Exception:
        return DISRUPTIONS
