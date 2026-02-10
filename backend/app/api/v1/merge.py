from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.merge_service import MergeService

router = APIRouter()

@router.post("/{company_id}/suggest", summary="Generate Mapping Suggestions")
def suggest_account_mappings(company_id: UUID, db: Session = Depends(get_db)):
    """
    Analyzes a company's CoA against the Master Chart and generates
    mapping suggestions based on similarity scores.
    """
    service = MergeService(db)
    try:
        suggestions = service.suggest_mappings(company_id)
        return {"message": f"{len(suggestions)} mapping suggestions generated successfully."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{company_id}/report", summary="Get Merge Analysis Report")
def get_merge_analysis_report(company_id: UUID, db: Session = Depends(get_db)):
    """
    Returns a comprehensive JSON report detailing the state of the merge,
    including stats, conflicts, and suggestions.
    """
    service = MergeService(db)
    return service.generate_merge_report(company_id)

@router.post("/{company_id}/auto", summary="Automatically Confirm High-Confidence Mappings")
def auto_confirm_mappings(company_id: UUID, threshold: float = 0.85, db: Session = Depends(get_db)):
    """
    Automatically confirms all 'suggested' mappings that meet or exceed
    the provided confidence threshold.
    """
    service = MergeService(db)
    result = service.auto_merge(company_id, threshold)
    return result

@router.get("/{company_id}/preview", summary="Preview Suggested Mappings")
def preview_suggested_mappings(company_id: UUID, db: Session = Depends(get_db)):
    """
    Returns a payload optimized for frontend display, showing company accounts
    and their top mapping suggestions.
    """
    service = MergeService(db)
    return service.get_preview(company_id)
