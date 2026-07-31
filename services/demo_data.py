from datetime import date, timedelta
from typing import List, Optional

COMPANIES = [
    {"id": "5f00a162-8742-4375-889c-95a7c86296c8", "name": "Tata Motors", "location": "Pune", "country": "India"},
    {
        "id": "99210b5c-4bc8-417a-b52a-6c66057441ae",
        "name": "Maruti Suzuki India",
        "location": "Gurgaon",
        "country": "India",
    },
    {"id": "00a3f7b6-ef5a-4098-856f-0cf629003c5c", "name": "Arvind Mills", "location": "Ahmedabad", "country": "India"},
]

SUPPLIERS = [
    {
        "id": "sup-pune-castings",
        "name": "Pune Precision Castings",
        "risk_score": 72,
        "location": "Pune",
        "country": "India",
        "cost_index": 46,
        "rating": 4.3,
        "lead_time_days": 8,
    },
    {
        "id": "sup-gujarat-electronics",
        "name": "Gujarat Electronics Cluster",
        "risk_score": 58,
        "location": "Ahmedabad",
        "country": "India",
        "cost_index": 52,
        "rating": 4.1,
        "lead_time_days": 12,
    },
    {
        "id": "sup-chennai-logistics",
        "name": "Chennai Port Logistics",
        "risk_score": 81,
        "location": "Chennai",
        "country": "India",
        "cost_index": 61,
        "rating": 3.8,
        "lead_time_days": 16,
    },
    {
        "id": "sup-vietnam-wiring",
        "name": "Vietnam Wiring Systems",
        "risk_score": 42,
        "location": "Ho Chi Minh City",
        "country": "Vietnam",
        "cost_index": 55,
        "rating": 4.4,
        "lead_time_days": 22,
    },
    {
        "id": "sup-coimbatore-textiles",
        "name": "Coimbatore Technical Textiles",
        "risk_score": 49,
        "location": "Coimbatore",
        "country": "India",
        "cost_index": 43,
        "rating": 4.5,
        "lead_time_days": 10,
    },
    {
        "id": "sup-bangladesh-fabric",
        "name": "Dhaka Fabric Works",
        "risk_score": 63,
        "location": "Dhaka",
        "country": "Bangladesh",
        "cost_index": 39,
        "rating": 4.0,
        "lead_time_days": 18,
    },
]

DEPENDENCIES = {
    COMPANIES[0]["id"]: ["sup-pune-castings", "sup-gujarat-electronics", "sup-chennai-logistics", "sup-vietnam-wiring"],
    COMPANIES[1]["id"]: ["sup-gujarat-electronics", "sup-chennai-logistics", "sup-vietnam-wiring"],
    COMPANIES[2]["id"]: ["sup-coimbatore-textiles", "sup-bangladesh-fabric", "sup-gujarat-electronics"],
}

ALTERNATIVES = {
    COMPANIES[0]["id"]: ["sup-vietnam-wiring", "sup-coimbatore-textiles"],
    COMPANIES[1]["id"]: ["sup-pune-castings", "sup-vietnam-wiring"],
    COMPANIES[2]["id"]: ["sup-coimbatore-textiles", "sup-vietnam-wiring"],
}

DISRUPTIONS = [
    {
        "id": "demo-disruption-1",
        "location": "Chennai",
        "country": "India",
        "event_type": "Port Congestion",
        "severity": "High",
        "affected_industry": "Automotive",
        "start_date": (date.today() - timedelta(days=2)).isoformat(),
        "source_url": "https://example.com/chennai-port-congestion",
    },
    {
        "id": "demo-disruption-2",
        "location": "Gujarat",
        "country": "India",
        "event_type": "Factory Shutdown",
        "severity": "Medium",
        "affected_industry": "Electronics",
        "start_date": (date.today() - timedelta(days=5)).isoformat(),
        "source_url": "https://example.com/gujarat-factory-shutdown",
    },
    {
        "id": "demo-disruption-3",
        "location": "Global",
        "country": "Global",
        "event_type": "Semiconductor Shortage",
        "severity": "Medium",
        "affected_industry": "Manufacturing",
        "start_date": (date.today() - timedelta(days=9)).isoformat(),
        "source_url": "https://example.com/semiconductor-shortage",
    },
]


def find_company(company_id: str) -> Optional[dict]:
    return next((company for company in COMPANIES if company["id"] == company_id), None)


def suppliers_for_company(company_id: str) -> List[dict]:
    supplier_ids = DEPENDENCIES.get(company_id, [])
    return [supplier for supplier in SUPPLIERS if supplier["id"] in supplier_ids]


def alternatives_for_company(company_id: str) -> List[dict]:
    supplier_ids = ALTERNATIVES.get(company_id, [])
    return [supplier for supplier in SUPPLIERS if supplier["id"] in supplier_ids]


def composite_score(supplier: dict) -> float:
    cost = float(supplier.get("cost_index") or 50)
    risk = float(supplier.get("risk_score") or 50)
    lead = float(supplier.get("lead_time_days") or 30)
    rating = float(supplier.get("rating") or 3)
    return round((100 - risk) * 0.4 + rating * 10 * 0.3 + (100 - cost) * 0.2 + (60 - lead) * 0.1, 2)
