"""Synthetic fallback data for SuplAI public demo mode.

This dataset intentionally mirrors the shape of the production schema without
using identifiable real-company names. The IDs below are stable so the local
fallback behaves consistently with the seeded Supabase demo environment.
"""

from datetime import date, timedelta
from typing import Dict, List, Optional


COMPANIES = [
    {"id": "d923c381-61f8-4ede-955e-c0fc594c13c9", "name": "Apex Motor Systems", "location": "New Delhi", "country": "India"},
    {"id": "5f3601b6-9c5d-432c-a194-0c7d58cfb5e7", "name": "BlueWeave Textiles", "location": "Thane", "country": "India"},
    {"id": "99210b5c-4bc8-417a-b52a-6c66057441ae", "name": "Horizon Auto Works", "location": "Gurugram", "country": "India"},
    {"id": "00a3f7b6-ef5a-4098-856f-0cf629003c5c", "name": "Loomline Textiles", "location": "Ahmedabad", "country": "India"},
    {"id": "4731200d-6ac2-4d83-afe3-bc2f26fcc448", "name": "Meridian Biocare", "location": "Pune", "country": "India"},
    {"id": "5f00a162-8742-4375-889c-95a7c86296c8", "name": "Northstar Mobility", "location": "Pune", "country": "India"},
    {"id": "e6367df5-e8c1-4549-9d64-f6e33228a7f9", "name": "NovaPharm Manufacturing", "location": "Hyderabad", "country": "India"},
    {"id": "87d58d74-2602-43b4-87f2-bd24b8d949f0", "name": "Solstice Pharma", "location": "Mumbai", "country": "India"},
    {"id": "4991bb58-15a1-4c79-b197-2ee4d2f2f1c1", "name": "TerraDrive Industries", "location": "Mumbai", "country": "India"},
    {"id": "f4268796-d975-4dd6-bf98-fbee268c3ce6", "name": "Vertex Fiberworks", "location": "Mumbai", "country": "India"},
]


# Stable synthetic suppliers. The first 30 mirror the richer Supabase demo
# roster; the remaining entries expand the fallback network without using
# real company names.
_SUPPLIER_NAMES = [
    "Apex Industrial Materials", "Vantage Specialty Chemicals", "Meridian BioSupply",
    "Nova Active Ingredients", "RheinChem Materials", "Greenfield AgroScience",
    "ForgePoint Components", "Vector Motion Systems", "Shenzhen Mobility Parts",
    "Eastgate Auto Components", "Prairie Agri Inputs", "NorthBridge Steelworks",
    "Hanover Mobility Systems", "Lakeside Power Electronics", "Formosa Circuit Works",
    "Great Lakes Polymers", "Ridgeway Performance Chemicals", "Pacific Looms Group",
    "Shenzhen Assembly Works", "Coastline Pharma Inputs", "Hangzhou Textile Hub",
    "Silicon Ridge Components", "Taipei Embedded Systems", "Rhine BioProcess Materials",
    "Atlantic Therapeutics Supply", "BlueThread Denim Works", "Shanghai Specialty Polymers",
    "Precision Drive Components", "IslandCore Semiconductors", "Wuxi Biologics Hub",
    "DeltaForge Components", "Summit Electrical Works", "CedarPeak Materials",
    "IronVale Precision", "Orion Control Systems", "MapleLine Industrial",
    "Vertex Motion Labs", "BluePeak Electronics", "Evergreen Polymer Works",
    "GraniteEdge Metals", "SilverOak Sensors", "Asteria Packaging",
    "Northfield Automation", "Pioneer Thermal Systems", "CobaltWire Manufacturing",
    "HarborPoint Logistics", "Redwood Chemical Supply", "Skyline Mechanical Parts",
    "Clearview Industrial Co.", "Stonebridge Components", "Atlas Subcomponents",
    "Beacon Raw Materials", "Crestline Precision", "Driftwood Electronics",
    "Elmstone Metals", "Frontier Controls", "Granular Polymers", "Highland Sensors",
    "Ivory Packaging Labs", "Juniper Mechanical", "Keystone Circuitry", "Lattice Industrial",
    "Monarch Thermal Works", "Nimbus Alloy Supply", "Oakline Power Systems",
    "Pinnacle Industrial Goods", "Quartz Motion Parts", "Riverside Chemical Works",
    "Summit Fabrication", "Timberline Components",
]

_LOCATIONS = [
    ("Pune", "India"), ("Mumbai", "India"), ("Ahmedabad", "India"),
    ("Bengaluru", "India"), ("Hyderabad", "India"), ("Chennai", "India"),
    ("Noida", "India"), ("Gurugram", "India"), ("Surat", "India"),
    ("Coimbatore", "India"), ("Vadodara", "India"), ("Nashik", "India"),
    ("Rajkot", "India"), ("Jamshedpur", "India"), ("Jaipur", "India"),
]


def _supplier_id(index: int) -> str:
    return f"demo-supplier-{index:03d}"


SUPPLIERS: List[dict] = []
for index, name in enumerate(_SUPPLIER_NAMES, start=1):
    location, country = _LOCATIONS[(index - 1) % len(_LOCATIONS)]
    risk = 28 + ((index * 17) % 49)
    rating = round(3.6 + ((index * 7) % 11) / 10, 1)
    cost = 68 + ((index * 13) % 45)
    incidents = (index * 3) % 5
    lead = 7 + ((index * 5) % 16)
    SUPPLIERS.append(
        {
            "id": _supplier_id(index),
            "name": name,
            "risk_score": risk,
            "location": location,
            "country": country,
            "cost_index": cost,
            "rating": rating,
            "lead_time_days": lead,
            "historical_incidents": incidents,
        }
    )


# Shared network: every company has six direct suppliers, with overlap across
# adjacent companies so the graph has repeated paths and concentration points.
DEPENDENCIES: Dict[str, List[str]] = {}
ALTERNATIVES: Dict[str, List[str]] = {}

for company_index, company in enumerate(COMPANIES):
    start = company_index * 6
    supplier_ids = [_supplier_id(((start + offset) % len(SUPPLIERS)) + 1) for offset in range(6)]
    # Add two shared suppliers from the overall network to increase coupling.
    shared_a = _supplier_id(((company_index + 3) % len(SUPPLIERS)) + 1)
    shared_b = _supplier_id(((company_index * 3 + 17) % len(SUPPLIERS)) + 1)
    ids = list(dict.fromkeys(supplier_ids + [shared_a, shared_b]))
    DEPENDENCIES[company["id"]] = ids
    alternatives = [ids[1], ids[4], shared_b]
    ALTERNATIVES[company["id"]] = list(dict.fromkeys(alternatives))


DISRUPTIONS = [
    {
        "id": "demo-disruption-1",
        "location": "Chennai",
        "country": "India",
        "event_type": "Regional Logistics Delay",
        "severity": "High",
        "affected_industry": "Automotive",
        "start_date": (date.today() - timedelta(days=2)).isoformat(),
        "source_url": "https://example.com/demo/logistics-delay",
    },
    {
        "id": "demo-disruption-2",
        "location": "Gujarat",
        "country": "India",
        "event_type": "Extreme Weather Event",
        "severity": "Medium",
        "affected_industry": "Electronics",
        "start_date": (date.today() - timedelta(days=5)).isoformat(),
        "source_url": "https://example.com/demo/weather-event",
    },
    {
        "id": "demo-disruption-3",
        "location": "East Asia",
        "country": "Regional",
        "event_type": "Semiconductor Supply Shock",
        "severity": "High",
        "affected_industry": "Manufacturing",
        "start_date": (date.today() - timedelta(days=9)).isoformat(),
        "source_url": "https://example.com/demo/semiconductor-shock",
    },
    {
        "id": "demo-disruption-4",
        "location": "Western India",
        "country": "India",
        "event_type": "Factory Capacity Reduction",
        "severity": "Medium",
        "affected_industry": "Chemicals",
        "start_date": (date.today() - timedelta(days=12)).isoformat(),
        "source_url": "https://example.com/demo/factory-capacity",
    },
    {
        "id": "demo-disruption-5",
        "location": "Southern India",
        "country": "India",
        "event_type": "Flooding",
        "severity": "High",
        "affected_industry": "Textiles",
        "start_date": (date.today() - timedelta(days=16)).isoformat(),
        "source_url": "https://example.com/demo/flooding",
    },
]


def find_company(company_id: str) -> Optional[dict]:
    return next((company for company in COMPANIES if company["id"] == company_id), None)


def suppliers_for_company(company_id: str) -> List[dict]:
    supplier_ids = set(DEPENDENCIES.get(company_id, []))
    return [supplier for supplier in SUPPLIERS if supplier["id"] in supplier_ids]


def alternatives_for_company(company_id: str) -> List[dict]:
    supplier_ids = set(ALTERNATIVES.get(company_id, []))
    return [supplier for supplier in SUPPLIERS if supplier["id"] in supplier_ids]


def composite_score(supplier: dict) -> float:
    cost = float(supplier.get("cost_index") or 50)
    risk = float(supplier.get("risk_score") or 50)
    lead = float(supplier.get("lead_time_days") or 30)
    rating = float(supplier.get("rating") or 3)
    return round(
        (100 - risk) * 0.4
        + rating * 10 * 0.3
        + (100 - cost) * 0.2
        + (60 - lead) * 0.1,
        2,
    )
