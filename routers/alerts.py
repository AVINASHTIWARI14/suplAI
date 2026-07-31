from typing import List

from fastapi import APIRouter

from core.models import Alert
from services.alert_service import get_alerts, mark_alert_read

router = APIRouter()


@router.get("/{company_id}", response_model=List[Alert])
def read_alerts(company_id: str, unread_only: bool = False) -> List[Alert]:
    return get_alerts(company_id, unread_only=unread_only)


@router.patch("/{alert_id}/read")
def read_alert(alert_id: str) -> dict:
    ok = mark_alert_read(alert_id)
    return {"ok": ok}
