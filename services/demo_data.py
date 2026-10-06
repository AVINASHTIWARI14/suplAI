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

# Keep the fallback data visually consistent with the richer Supabase demo.
# This matters when Supabase briefly fails on a cold request: the API falls
# back to this module, so the dashboard should not momentarily show a tiny,
# India-only network before becoming correct on a revisit.
_GLOBAL_LOCATIONS = {
    "Apex Industrial Materials": ("St. Paul, MN", "USA", 44.9537, -93.09),
    "DeltaForge Components": ("Pune", "India", 18.5204, 73.8567),
    "Vantage Specialty Chemicals": ("Vapi", "India", 20.3893, 72.9106),
    "Vector Motion Systems": ("Stuttgart", "Germany", 48.7758, 9.1829),
    "NorthBridge Steelworks": ("Beijing", "China", 39.9042, 116.4074),
    "Summit Electrical Works": ("Bengaluru", "India", 12.9716, 77.5946),
    "Harbor Robotics Supply": ("Dallas, TX", "USA", 32.7767, -96.7970),
    "Maple Circuit Materials": ("Toronto", "Canada", 43.6532, -79.3832),
    "Sierra Assembly Works": ("Monterrey", "Mexico", 25.6866, -100.3161),
    "Rio Polymer Systems": ("Sao Paulo", "Brazil", -23.5505, -46.6333),
    "Thames Precision Ltd": ("London", "United Kingdom", 51.5074, -0.1278),
    "Loire Industrial Components": ("Lyon", "France", 45.7640, 4.8357),
    "Delta Port Technologies": ("Rotterdam", "Netherlands", 51.9244, 4.4777),
    "GulfLink Components": ("Dubai", "UAE", 25.2048, 55.2708),
    "CapeFoundry Materials": ("Johannesburg", "South Africa", -26.2041, 28.0473),
    "Bosphorus Electromech": ("Istanbul", "Turkey", 41.0082, 28.9784),
    "Sakura Motion Works": ("Tokyo", "Japan", 35.6762, 139.6503),
    "Han River Electronics": ("Seoul", "South Korea", 37.5665, 126.9780),
    "Mekong Precision Systems": ("Ho Chi Minh City", "Vietnam", 10.8231, 106.6297),
    "Java Industrial Supply": ("Jakarta", "Indonesia", -6.2088, 106.8456),
    "Southern Cross Components": ("Sydney", "Australia", -33.8688, 151.2093),
    "Vistula Manufacturing": ("Warsaw", "Poland", 52.2297, 21.0122),
    "Adriatic Thermal Works": ("Milan", "Italy", 45.4642, 9.1900),
    "Andes Copper Inputs": ("Santiago", "Chile", -33.4489, -70.6693),
    "Nile Industrial Logistics": ("Cairo", "Egypt", 30.0444, 31.2357),
    "StraitLink Materials": ("Kuala Lumpur", "Malaysia", 3.1390, 101.6869),
}

supplier_by_name = {supplier["name"]: supplier for supplier in SUPPLIERS}
for name, (location, country, latitude, longitude) in _GLOBAL_LOCATIONS.items():
    supplier = supplier_by_name.get(name)
    if supplier:
        supplier["location"] = location
        supplier["country"] = country
        supplier["latitude"] = latitude
        supplier["longitude"] = longitude

_APEX_FALLBACK_NAMES = [
    "Apex Industrial Materials",
    "DeltaForge Components",
    "Vantage Specialty Chemicals",
    "Vector Motion Systems",
    "NorthBridge Steelworks",
    "Summit Electrical Works",
    "Harbor Robotics Supply",
    "Maple Circuit Materials",
    "Sierra Assembly Works",
    "Rio Polymer Systems",
    "Thames Precision Ltd",
    "Loire Industrial Components",
    "Delta Port Technologies",
    "GulfLink Components",
    "CapeFoundry Materials",
    "Bosphorus Electromech",
    "Sakura Motion Works",
    "Han River Electronics",
    "Mekong Precision Systems",
    "Java Industrial Supply",
    "Southern Cross Components",
    "Vistula Manufacturing",
    "Adriatic Thermal Works",
    "Andes Copper Inputs",
    "Nile Industrial Logistics",
    "StraitLink Materials",
]
_apex_lookup = {supplier["name"]: supplier["id"] for supplier in SUPPLIERS}
_apex_id = COMPANIES[0]["id"]
DEPENDENCIES[_apex_id] = [
    _apex_lookup[name]
    for name in _APEX_FALLBACK_NAMES
    if name in _apex_lookup
]
ALTERNATIVES[_apex_id] = [
    _apex_lookup[name]
    for name in [
        "Vantage Specialty Chemicals",
        "NorthBridge Steelworks",
        "Summit Electrical Works",
        "GulfLink Components",
        "CapeFoundry Materials",
        "Sakura Motion Works",
        "Han River Electronics",
        "Mekong Precision Systems",
        "Java Industrial Supply",
        "Southern Cross Components",
        "Adriatic Thermal Works",
        "Nile Industrial Logistics",
        "StraitLink Materials",
    ]
    if name in _apex_lookup
]


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
