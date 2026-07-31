from typing import List

from fastapi import APIRouter

from core.database import supabase
from core.models import Company
from core.supabase_helpers import response_data
from services.demo_data import COMPANIES

router = APIRouter()


@router.get("", response_model=List[Company])
def read_companies() -> List[Company]:
    rows = []
    if supabase:
        try:
            rows = response_data(
                supabase.table("companies")
                .select("id, name, location, country")
                .order("name")
                .execute()
            ) or []
        except Exception:
            rows = []
    if not rows:
        rows = COMPANIES
    return [
        Company(
            id=row["id"],
            name=row.get("name", "Unknown"),
            location=row.get("location"),
            country=row.get("country"),
        )
        for row in rows
    ]
