from typing import List

from fastapi import APIRouter

from core.models import DisruptionEvent
from services.disruption_service import get_active_disruptions

router = APIRouter()


@router.get("/active", response_model=List[DisruptionEvent])
def read_active_disruptions() -> List[DisruptionEvent]:
    return get_active_disruptions()
