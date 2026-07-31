from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException

from core.deps import require_admin
from core.models import (
    CsvImportResult,
    SupplierAlternative,
    SupplierCreate,
    SupplierRisk,
    SupplierUpdate,
)
from services.supplier_service import (
    create_supplier,
    delete_supplier,
    get_supplier_alternatives,
    get_supplier_risk,
    import_suppliers_csv,
    update_supplier,
)

router = APIRouter()


@router.get("/{company_id}/risk", response_model=List[SupplierRisk])
def read_supplier_risk(company_id: str) -> List[SupplierRisk]:
    return get_supplier_risk(company_id)


@router.get("/{company_id}/alternatives", response_model=List[SupplierAlternative])
def read_supplier_alternatives(company_id: str) -> List[SupplierAlternative]:
    return get_supplier_alternatives(company_id)


# ---- CRUD (admin only) ------------------------------------------------------
@router.post("", response_model=SupplierRisk, status_code=201)
def create(body: SupplierCreate, _user=Depends(require_admin)) -> SupplierRisk:
    try:
        return create_supplier(body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{supplier_id}", response_model=SupplierRisk)
def update(supplier_id: str, body: SupplierUpdate, _user=Depends(require_admin)) -> SupplierRisk:
    try:
        return update_supplier(supplier_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{supplier_id}")
def remove(supplier_id: str, _user=Depends(require_admin)) -> dict:
    try:
        return delete_supplier(supplier_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/import/{company_id}", response_model=CsvImportResult)
def bulk_import(
    company_id: str,
    csv_text: str = Body(..., embed=True, max_length=1_000_000),
    _user=Depends(require_admin),
) -> CsvImportResult:
    """Bulk import suppliers from raw CSV text. Reports per-row errors."""
    try:
        result = import_suppliers_csv(csv_text, company_id)
        return CsvImportResult(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
