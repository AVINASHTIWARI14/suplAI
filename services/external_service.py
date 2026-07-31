"""Real external data integrations — all FREE tiers, keys via .env only.

Providers:
  * OpenWeatherMap      severe weather -> risk signal   (OPENWEATHER_API_KEY)
  * OpenStreetMap Nominatim  geocoding                  (no key; User-Agent)
  * NewsData.io         disruption news feed            (NEWSDATA_API_KEY)
  * ExchangeRate-API    currency volatility -> risk     (EXCHANGERATE_API_KEY)

Every function degrades gracefully: if the key is missing or the call fails,
it returns a deterministic fallback and sets `source="fallback"` so callers
and the UI can clearly flag demo data instead of silently faking it.
"""
import os
from typing import List, Optional

import httpx

from core.models import (
    FxSignal,
    GeocodeResult,
    NewsFeed,
    NewsHeadline,
    WeatherSignal,
)

_TIMEOUT = httpx.Timeout(8.0)


def _key(name: str) -> str:
    return (os.getenv(name) or "").strip()


# ---------------------------------------------------------------------------
# OpenWeatherMap
# ---------------------------------------------------------------------------
def _weather_severity(condition: str, wind_mps: float, temp_c: float) -> tuple[str, float]:
    cond = (condition or "").lower()
    severe_terms = ("thunderstorm", "tornado", "hurricane", "squall", "ash", "snow", "storm")
    moderate_terms = ("rain", "drizzle", "fog", "mist", "smoke", "dust", "sand")
    if any(t in cond for t in severe_terms) or wind_mps >= 17 or temp_c >= 45 or temp_c <= -10:
        return "high", 20.0
    if any(t in cond for t in moderate_terms) or wind_mps >= 10 or temp_c >= 38:
        return "medium", 10.0
    return "low", 0.0


def get_weather_signal(lat: float, lon: float, location: Optional[str] = None) -> WeatherSignal:
    api_key = _key("OPENWEATHER_API_KEY")
    if not api_key:
        return WeatherSignal(
            latitude=lat, longitude=lon, location=location,
            condition="Clear", description="demo: no OPENWEATHER_API_KEY set",
            temp_c=24.0, wind_mps=3.0, severity="low", risk_contribution=0.0,
            source="fallback",
        )
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        weather = (data.get("weather") or [{}])[0]
        condition = weather.get("main", "Clear")
        description = weather.get("description", "")
        temp_c = float((data.get("main") or {}).get("temp", 20.0))
        wind_mps = float((data.get("wind") or {}).get("speed", 0.0))
        severity, contribution = _weather_severity(condition, wind_mps, temp_c)
        return WeatherSignal(
            latitude=lat, longitude=lon, location=location or data.get("name"),
            condition=condition, description=description, temp_c=temp_c,
            wind_mps=wind_mps, severity=severity, risk_contribution=contribution,
            source="openweathermap",
        )
    except Exception:
        return WeatherSignal(
            latitude=lat, longitude=lon, location=location,
            condition=None, description="weather lookup failed",
            severity="low", risk_contribution=0.0, source="fallback",
        )


# ---------------------------------------------------------------------------
# OpenStreetMap Nominatim (no key required)
# ---------------------------------------------------------------------------
def geocode_address(query: str) -> GeocodeResult:
    query = (query or "").strip()
    if not query:
        return GeocodeResult(query=query, source="fallback")
    ua = _key("NOMINATIM_USER_AGENT") or "suplai/1.0 (contact@example.com)"
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": query, "format": "json", "limit": 1}
        with httpx.Client(timeout=_TIMEOUT, headers={"User-Agent": ua}) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            rows = resp.json()
        if not rows:
            return GeocodeResult(query=query, source="nominatim")
        row = rows[0]
        return GeocodeResult(
            query=query,
            latitude=float(row["lat"]),
            longitude=float(row["lon"]),
            display_name=row.get("display_name"),
            source="nominatim",
        )
    except Exception:
        return GeocodeResult(query=query, source="fallback")


# ---------------------------------------------------------------------------
# NewsData.io
# ---------------------------------------------------------------------------
_FALLBACK_HEADLINES = [
    ("Port congestion delays shipments at major Asian hub", "demo", ["port", "logistics"]),
    ("Factory fire disrupts electronics component supply", "demo", ["factory fire"]),
    ("Regional strike affects freight movement", "demo", ["strike", "labour"]),
]


def get_news_feed(query: str = "supply chain disruption OR port strike OR factory fire") -> NewsFeed:
    api_key = _key("NEWSDATA_API_KEY")
    if not api_key:
        return NewsFeed(
            query=query,
            headlines=[
                NewsHeadline(title=t, source=s, keywords=k) for t, s, k in _FALLBACK_HEADLINES
            ],
            source="fallback",
        )
    try:
        url = "https://newsdata.io/api/1/news"
        params = {"apikey": api_key, "q": query, "language": "en", "category": "business"}
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        headlines: List[NewsHeadline] = []
        for item in (data.get("results") or [])[:20]:
            headlines.append(
                NewsHeadline(
                    title=item.get("title") or "(untitled)",
                    source=item.get("source_id"),
                    link=item.get("link"),
                    published_at=item.get("pubDate"),
                    keywords=item.get("keywords") or [],
                )
            )
        return NewsFeed(query=query, headlines=headlines, source="newsdata.io")
    except Exception:
        return NewsFeed(
            query=query,
            headlines=[NewsHeadline(title=t, source=s, keywords=k) for t, s, k in _FALLBACK_HEADLINES],
            source="fallback",
        )


# ---------------------------------------------------------------------------
# ExchangeRate-API
# ---------------------------------------------------------------------------
# Rough baseline rates vs USD for a handful of supplier currencies, used to
# derive a "volatility" proxy without paid historical endpoints.
_BASELINE_USD = {
    "INR": 83.0, "CNY": 7.2, "EUR": 0.92, "JPY": 150.0,
    "GBP": 0.79, "VND": 24500.0, "THB": 36.0, "MXN": 17.0, "BRL": 5.0,
}


def get_fx_signal(quote: str, base: str = "USD") -> FxSignal:
    quote = (quote or "").upper().strip()
    base = (base or "USD").upper().strip()
    api_key = _key("EXCHANGERATE_API_KEY")
    if not quote or quote == base:
        return FxSignal(base=base, quote=quote or base, rate=1.0, volatility=0.0,
                        risk_contribution=0.0, source="fallback")
    if not api_key:
        baseline = _BASELINE_USD.get(quote)
        return FxSignal(base=base, quote=quote, rate=baseline, volatility=0.0,
                        risk_contribution=0.0, source="fallback")
    try:
        url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/{base}/{quote}"
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
        rate = float(data.get("conversion_rate"))
        baseline = _BASELINE_USD.get(quote, rate)
        # Deviation from the baseline as a crude volatility proxy (0-1).
        volatility = min(1.0, abs(rate - baseline) / baseline) if baseline else 0.0
        contribution = round(volatility * 10.0, 2)  # up to +10 risk points
        return FxSignal(base=base, quote=quote, rate=rate, volatility=round(volatility, 3),
                        risk_contribution=contribution, source="exchangerate-api")
    except Exception:
        baseline = _BASELINE_USD.get(quote)
        return FxSignal(base=base, quote=quote, rate=baseline, volatility=0.0,
                        risk_contribution=0.0, source="fallback")
