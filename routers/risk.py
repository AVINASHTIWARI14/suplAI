from typing import List

from fastapi import APIRouter, Depends

from core.deps import require_admin
from core.models import RiskThresholds, RiskTrendPoint
from services.config_service import get_thresholds, set_thresholds
from services.risk_service import get_risk_trend, recalculate_supplier_risks

router = APIRouter()


@router.post("/recalculate/{company_id}")
def recalculate(
    company_id: str,
    include_weather: bool = False,
    _user=Depends(require_admin),
) -> dict:
    """Recompute supplier risk. include_weather=true folds in live severe-weather
    signal (OpenWeatherMap) when a key is configured. Admin only."""
    return recalculate_supplier_risks(company_id, include_weather=include_weather)


@router.get("/trend/{company_id}", response_model=List[RiskTrendPoint])
def trend(company_id: str, days: int = 30) -> List[RiskTrendPoint]:
    points = get_risk_trend(company_id, days=days)
    return [RiskTrendPoint(**p) for p in points]


@router.get("/thresholds", response_model=RiskThresholds)
def read_thresholds() -> RiskThresholds:
    return RiskThresholds(**get_thresholds())


@router.put("/thresholds", response_model=RiskThresholds)
def update_thresholds(body: RiskThresholds, _user=Depends(require_admin)) -> RiskThresholds:
    """Set low/medium risk boundaries (high is anything above medium_max). Admin only."""
    return RiskThresholds(**set_thresholds(body.low_max, body.medium_max))
