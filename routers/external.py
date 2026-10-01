from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.deps import get_current_user
from core.models import FxSignal, GeocodeResult, NewsFeed, WeatherSignal
from services.external_service import (
    geocode_address,
    get_fx_signal,
    get_news_feed,
    get_weather_signal,
)

router = APIRouter()


@router.get("/geocode", response_model=GeocodeResult)
def geocode(q: str = Query(..., min_length=2, max_length=200)) -> GeocodeResult:
    """Address -> lat/lng via OpenStreetMap Nominatim (no key required)."""
    return geocode_address(q)


@router.get("/weather", response_model=WeatherSignal)
def weather(
    lat: Optional[float] = Query(default=None, ge=-90, le=90),
    lon: Optional[float] = Query(default=None, ge=-180, le=180),
    location: Optional[str] = Query(default=None, max_length=120),
) -> WeatherSignal:
    """Current weather + severity/risk contribution.

    Coordinates are preferred. If only a city/address is available,
    geocode it first so the frontend can make a simple location-based call.
    """
    if lat is None or lon is None:
        if not location or not location.strip():
            raise HTTPException(
                status_code=400,
                detail="Provide either lat/lon coordinates or a location.",
            )

        geo = geocode_address(location)
        if geo.latitude is None or geo.longitude is None:
            raise HTTPException(
                status_code=404,
                detail=f"Could not geocode location: {location}",
            )

        lat, lon = geo.latitude, geo.longitude
        location = geo.display_name or location

    return get_weather_signal(lat, lon, location)


@router.get("/news", response_model=NewsFeed)
def news(
    q: str = Query(
        default="supply chain disruption OR port strike OR factory fire",
        max_length=300,
    ),
    user: dict = Depends(get_current_user),
) -> NewsFeed:
    """Recent disruption-related headlines via NewsData.io (auth required)."""
    return get_news_feed(q)


@router.get("/fx", response_model=FxSignal)
def fx(
    quote: str = Query(..., min_length=3, max_length=3),
    base: str = Query(default="USD", min_length=3, max_length=3),
) -> FxSignal:
    """Currency rate + volatility proxy via ExchangeRate-API."""
    return get_fx_signal(quote, base)
