from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from core.deps import get_current_user
from core.models import DashboardSummary
from services.dashboard_service import get_dashboard_summary
from services.export_service import build_csv_report, build_pdf_report

router = APIRouter()


@router.get("/{company_id}", response_model=DashboardSummary)
def read_dashboard(company_id: str) -> DashboardSummary:
    try:
        return get_dashboard_summary(company_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{company_id}/export.csv")
def export_csv(company_id: str, _user=Depends(get_current_user)) -> Response:
    data = build_csv_report(company_id)
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="suplai_report_{company_id}.csv"'},
    )


@router.get("/{company_id}/export.pdf")
def export_pdf(company_id: str, _user=Depends(get_current_user)) -> Response:
    try:
        data = build_pdf_report(company_id)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="suplai_report_{company_id}.pdf"'},
    )
