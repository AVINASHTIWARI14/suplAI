from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class Company(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    country: Optional[str] = None


class SupplierRisk(BaseModel):
    id: str
    name: str
    risk_score: float
    location: Optional[str] = None
    country: Optional[str] = None
    cost_index: Optional[float] = None
    rating: Optional[float] = None
    lead_time_days: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SupplierAlternative(BaseModel):
    id: str
    name: str
    cost_index: Optional[float] = None
    lead_time_days: Optional[int] = None
    risk_score: Optional[float] = None
    rating: Optional[float] = None
    location: Optional[str] = None
    country: Optional[str] = None
    composite_score: Optional[float] = None


class DisruptionEvent(BaseModel):
    id: str
    location: Optional[str] = None
    country: Optional[str] = None
    event_type: Optional[str] = None
    severity: Optional[str] = None
    affected_industry: Optional[str] = None
    start_date: Optional[str] = None
    source_url: Optional[str] = None


class DashboardSummary(BaseModel):
    company_id: str
    overall_risk_score: float
    top_risky_suppliers: List[SupplierRisk]
    active_disruptions: List[DisruptionEvent]


class GraphNode(BaseModel):
    id: str
    label: str
    type: str = "supplier"
    risk_score: Optional[float] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str = "depends_on"


class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "viewer"
    company_id: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserPublic


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    company_id: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class Alert(BaseModel):
    id: str
    company_id: str
    supplier_id: Optional[str] = None
    title: str
    message: Optional[str] = None
    severity: str = "medium"
    is_read: bool = False
    created_at: Optional[str] = None


class RiskTrendPoint(BaseModel):
    date: str
    score: float


class PipelineResult(BaseModel):
    fetched: int
    saved: int
    message: str


# ---- What-If disruption simulation ------------------------------------------
class SimulationRequest(BaseModel):
    company_id: str
    disrupted_node_ids: List[str] = Field(default_factory=list)
    # How strongly a disruption propagates to each downstream tier (0-1).
    decay: float = Field(default=0.55, ge=0.0, le=1.0)


class AffectedNode(BaseModel):
    id: str
    label: str
    base_risk: float
    added_risk: float
    projected_risk: float
    distance: int  # hops from the nearest disrupted node


class SimulationResult(BaseModel):
    company_id: str
    disrupted_node_ids: List[str]
    affected_nodes: List[AffectedNode]
    cascade_edges: List[GraphEdge]
    nodes_affected: int
    critical_paths_broken: int
    overall_risk_before: float
    overall_risk_after: float


# ---- External data signals --------------------------------------------------
class GeocodeResult(BaseModel):
    query: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    display_name: Optional[str] = None
    source: str = "nominatim"


class WeatherSignal(BaseModel):
    latitude: float
    longitude: float
    location: Optional[str] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    temp_c: Optional[float] = None
    wind_mps: Optional[float] = None
    severity: str = "low"          # low | medium | high
    risk_contribution: float = 0.0  # points added to a supplier's risk score
    source: str = "openweathermap"  # or "fallback"


class NewsHeadline(BaseModel):
    title: str
    source: Optional[str] = None
    link: Optional[str] = None
    published_at: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)


class NewsFeed(BaseModel):
    query: str
    headlines: List[NewsHeadline]
    source: str = "newsdata.io"  # or "fallback"


class FxSignal(BaseModel):
    base: str
    quote: str
    rate: Optional[float] = None
    volatility: float = 0.0
    risk_contribution: float = 0.0
    source: str = "exchangerate-api"  # or "fallback"


class RiskThresholds(BaseModel):
    low_max: float = Field(default=40.0, ge=0, le=100)
    medium_max: float = Field(default=70.0, ge=0, le=100)


# ---- Entity CRUD ------------------------------------------------------------
class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    company_id: str = Field(min_length=1)
    location: Optional[str] = Field(default=None, max_length=160)
    country: Optional[str] = Field(default=None, max_length=80)
    risk_score: float = Field(default=40.0, ge=0, le=100)
    cost_index: Optional[float] = Field(default=None, ge=0, le=100)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    lead_time_days: Optional[int] = Field(default=None, ge=0, le=365)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    is_alternate: bool = False


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    location: Optional[str] = Field(default=None, max_length=160)
    country: Optional[str] = Field(default=None, max_length=80)
    risk_score: Optional[float] = Field(default=None, ge=0, le=100)
    cost_index: Optional[float] = Field(default=None, ge=0, le=100)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    lead_time_days: Optional[int] = Field(default=None, ge=0, le=365)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class CsvImportError(BaseModel):
    row: int
    error: str


class CsvImportResult(BaseModel):
    imported: int
    failed: int
    errors: List[CsvImportError] = Field(default_factory=list)
    created_ids: List[str] = Field(default_factory=list)