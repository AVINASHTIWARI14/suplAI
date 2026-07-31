from fastapi import APIRouter

from core.models import GraphData, SimulationRequest, SimulationResult
from services.graph_service import get_graph_data, simulate_disruption

router = APIRouter()


@router.get("/{company_id}", response_model=GraphData)
def read_graph(company_id: str) -> GraphData:
    return get_graph_data(company_id)


@router.post("/simulate", response_model=SimulationResult)
def simulate(body: SimulationRequest) -> SimulationResult:
    """What-If disruption engine: propagate a shock through the network."""
    return simulate_disruption(body.company_id, body.disrupted_node_ids, body.decay)
