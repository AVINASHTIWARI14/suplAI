"""Admin-configurable risk thresholds (low/medium/high boundaries).

Persisted to data/risk_config.json in demo mode; if Supabase has an
`app_config` table it is used instead. Kept intentionally simple.
"""
import json
from pathlib import Path

from core.database import supabase
from core.supabase_helpers import response_data

CONFIG_FILE = Path(__file__).resolve().parent.parent / "data" / "risk_config.json"
_DEFAULTS = {"low_max": 40.0, "medium_max": 70.0}
_CONFIG_KEY = "risk_thresholds"


def _sanitize(low_max: float, medium_max: float) -> dict:
    low = max(0.0, min(100.0, float(low_max)))
    med = max(0.0, min(100.0, float(medium_max)))
    if med <= low:  # medium boundary must sit above low boundary
        med = min(100.0, low + 1.0)
    return {"low_max": round(low, 2), "medium_max": round(med, 2)}


def get_thresholds() -> dict:
    if supabase:
        try:
            rows = response_data(
                supabase.table("app_config").select("value").eq("key", _CONFIG_KEY).limit(1).execute()
            ) or []
            if rows and isinstance(rows[0].get("value"), dict):
                v = rows[0]["value"]
                return _sanitize(v.get("low_max", 40.0), v.get("medium_max", 70.0))
        except Exception:
            pass
    try:
        if CONFIG_FILE.exists():
            v = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            return _sanitize(v.get("low_max", 40.0), v.get("medium_max", 70.0))
    except Exception:
        pass
    return dict(_DEFAULTS)


def set_thresholds(low_max: float, medium_max: float) -> dict:
    clean = _sanitize(low_max, medium_max)
    if supabase:
        try:
            supabase.table("app_config").upsert(
                {"key": _CONFIG_KEY, "value": clean}, on_conflict="key"
            ).execute()
            return clean
        except Exception:
            pass
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(clean, indent=2), encoding="utf-8")
    return clean
