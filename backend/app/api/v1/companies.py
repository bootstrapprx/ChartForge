from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.db.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyInactivate, CompanyListResponse
from app.services.company_service import CompanyService


router = APIRouter()

@router.get("/", response_model=CompanyListResponse)
def list_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all companies, separated by status with statistics.
    """
    all_companies = CompanyService.get_all_companies(db, active_only=False)
    
    # Sort by name
    all_companies.sort(key=lambda x: x.name.lower())
    
    active = [c for c in all_companies if c.is_active]
    inactive = [c for c in all_companies if not c.is_active]
    
    return {
        "active": active,
        "inactive": inactive,
        "stats": {
            "total": len(all_companies),
            "active": len(active),
            "inactive": len(inactive)
        }
    }

@router.post("/", response_model=CompanyResponse)
def create_company(
    company_in: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new company and generate its UCID.
    """
    try:
        return CompanyService.create_company(db, company_in, created_by_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company_by_id(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a company by its ID.
    """
    company = CompanyService.get_company_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/ucid/{ucid}", response_model=CompanyResponse)
def get_company_by_ucid(
    ucid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a company by its UCID.
    """
    company = CompanyService.get_company_by_ucid(db, ucid)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: UUID,
    company_update: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a company.
    """
    company = CompanyService.update_company(db, company_id, company_update)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.delete("/{company_id}")
def delete_company(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Hard delete a company.
    Restricted to Superusers only.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can perform a hard delete."
        )

    success = CompanyService.delete_company(db, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted successfully"}

@router.patch("/{ucid}/inactivate", response_model=CompanyResponse)
def inactivate_company(
    ucid: str,
    confirmation: CompanyInactivate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Inactivate a company. Requires name confirmation.
    """
    try:
        user_id = str(current_user.id)
        return CompanyService.inactivate_company(db, ucid, confirmation.confirmation, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{ucid}/activate", response_model=CompanyResponse)
def activate_company(
    ucid: str,
    confirmation: CompanyInactivate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activate a company. Requires name confirmation.
    """
    try:
        user_id = str(current_user.id)
        return CompanyService.activate_company(db, ucid, confirmation.confirmation, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{ucid}/restore", response_model=CompanyResponse, deprecated=True)
def restore_company(
    ucid: str,
    db: Session = Depends(get_db)
):
    """
    Restore a soft-deleted company. Deprecated in favor of /activate.
    """
    company = CompanyService.restore_company(db, ucid)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
