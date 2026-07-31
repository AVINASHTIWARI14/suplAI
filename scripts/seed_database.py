"""
Optional seed helper — run after schema.sql in Supabase.
  python scripts/seed_database.py
Creates demo user hash and can insert tier-2 supplier links if tables exist.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from core.security import hash_password  # noqa: E402

USERS_FILE = ROOT / "data" / "users.json"


def seed_local_users() -> None:
    users = [
        {
            "id": "admin-001",
            "email": "admin@suplai.com",
            "password_hash": hash_password("admin123"),
            "full_name": "Avinash Tiwari",
            "role": "admin",
            "company_id": None,
        },
        {
            "id": "viewer-002",
            "email": "viewer@suplai.com",
            "password_hash": hash_password("viewer123"),
            "full_name": "Read-Only User",
            "role": "viewer",
            "company_id": None,
        },
    ]
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")
    print(f"Wrote {len(users)} users to {USERS_FILE}")
    print("Login (admin):  admin@suplai.com / admin123")
    print("Login (viewer): viewer@suplai.com / viewer123")


if __name__ == "__main__":
    seed_local_users()
