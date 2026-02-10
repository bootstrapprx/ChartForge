from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.schemas.master_account import (
    MasterAccountSchema,
    MasterAccountCreate,
    MasterAccountUpdate,
    MasterAccountTree,
    ImportPreviewResult,
    ImportResult,
    COAVersionInfo,
    COAVersionDetail,
)
from app.services.masterchart_service import MasterChartService
from app.services.code_generator.service import CodeGeneratorService
from app.services.code_generator.exceptions import CodeGenerationException
from app.services.coa_version_service import COAVersionService
from app.services.import_engine import ImportEngine

router = APIRouter()

# --- Master Chart CRUD Endpoints ---

@router.get("", response_model=List[MasterAccountSchema], summary="Get Master Chart List", tags=["Master Chart"])
def get_master_chart_list(
    search: Optional[str] = None,
    category: Optional[str] = None,
    account_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all master accounts with optional filtering.
    
    Query parameters:
    - search: Search in code and description
    - category: Filter by category
    - account_type: Filter by type ('H' for Header, 'D' for Detail)
    """
    service = MasterChartService(db)
    accounts = service.get_all_accounts()
    
    # Apply filters
    if search:
        search_lower = search.lower()
        accounts = [
            acc for acc in accounts
            if search_lower in acc.code.lower() or search_lower in acc.description.lower()
        ]
    
    if category:
        accounts = [acc for acc in accounts if acc.category == category]
    
    if account_type:
        accounts = [acc for acc in accounts if acc.type == account_type.upper()]
    
    return accounts

@router.post("", response_model=MasterAccountSchema, status_code=status.HTTP_201_CREATED, summary="Create Account", tags=["Master Chart"])
def create_master_account(account_in: MasterAccountCreate, db: Session = Depends(get_db)):
    """
    Creates a new master account. If the `code` is omitted, it will be auto-generated.
    If `parent_code` is provided in the request body, the new account will be a child of that parent.
    """
    service = MasterChartService(db)
    try:
        return service.create_account(account_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except CodeGenerationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Code Generation Error: {e}")

@router.get("/tree", response_model=List[MasterAccountTree], summary="Get Master Chart as Tree", tags=["Master Chart"])
def get_master_chart_tree(db: Session = Depends(get_db)):
    service = MasterChartService(db)
    accounts = service.get_all_accounts()
    return service.build_tree(accounts)

@router.get("/stats", summary="Get CoA Statistics", tags=["Master Chart"])
def get_chart_statistics(db: Session = Depends(get_db)):
    service = MasterChartService(db)
    return service.get_coa_stats()

@router.post("/rebuild-hierarchy", summary="Rebuild Hierarchy", tags=["Master Chart"])
def rebuild_master_chart_hierarchy(db: Session = Depends(get_db)):
    service = MasterChartService(db)
    service.rebuild_hierarchy()
    return {"status": "success", "message": "Hierarchy rebuilt successfully."}

@router.get("/categories", summary="Get All Categories", tags=["Master Chart"])
def get_categories(db: Session = Depends(get_db)):
    """Get all unique categories from master accounts."""
    service = MasterChartService(db)
    return service.get_categories()

@router.get("/{code}", response_model=MasterAccountSchema, summary="Get Account by Code", tags=["Master Chart"])
def get_master_account(code: str, db: Session = Depends(get_db)):
    service = MasterChartService(db)
    account = service.get_account_by_code(code)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account

@router.get("/id/{account_id}", response_model=MasterAccountSchema, summary="Get Account by ID", tags=["Master Chart"])
def get_master_account_by_id(account_id: UUID, db: Session = Depends(get_db)):
    service = MasterChartService(db)
    account = service.get_account_by_id(account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account

@router.put("/{code}", response_model=MasterAccountSchema, summary="Update Account", tags=["Master Chart"])
def update_master_account(code: str, account_in: MasterAccountUpdate, db: Session = Depends(get_db)):
    service = MasterChartService(db)
    try:
        updated_account = service.update_account(code, account_in)
        if not updated_account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
        return updated_account
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{code}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Account", tags=["Master Chart"])
def delete_master_account(code: str, db: Session = Depends(get_db)):
    service = MasterChartService(db)
    try:
        if not service.delete_account(code):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/template/default", response_model=List[MasterAccountTree], summary="Get Default Template Hierarchy", tags=["Master Chart"])
def get_default_template(db: Session = Depends(get_db)):
    """
    Returns the full hierarchy of the default master chart template.
    This is effectively the same as /tree but explicitly for the template view context.
    """
    from app import chart_library
    return chart_library.build_tree()

@router.get("/tags", summary="Get All Tags", tags=["Master Chart"])
def get_tags(db: Session = Depends(get_db)):
    """Get all unique tags from master accounts."""
    service = MasterChartService(db)
    return service.get_tags()

@router.post("/template/apply/{company_ucid}", summary="Apply Template to Company", tags=["Master Chart"])
def apply_template_to_company(
    company_ucid: str,
    update_existing: bool = Query(False, description="Update existing accounts"),
    create_version: bool = Query(True, description="Create version snapshot"),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Apply the master template to a company's chart of accounts.
    This clones the template accounts for the specified company.
    """
    from app.services.master_template_service import get_template_service
    from app.schemas.master_account import MasterAccountCreate
    
    template_service = get_template_service()
    masterchart_service = MasterChartService(db)
    version_service = COAVersionService(db)
    
    template_accounts = template_service.get_template_accounts()
    if not template_accounts:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Template is empty or not loaded"
        )

    # Get existing accounts
    existing_accounts = masterchart_service.get_all_accounts()
    existing_codes = {acc.code for acc in existing_accounts}

    # Create version snapshot before applying
    if create_version:
        version_service.create_version_snapshot(
            description=f"Before applying template to {company_ucid}",
            source="template_apply",
            user_id=user_id,
            company_ucid=company_ucid,
        )

    report = {
        "company_ucid": company_ucid,
        "template_accounts": len(template_accounts),
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": [],
    }

    for acc_data in template_accounts:
        code = acc_data.get('code')
        if not code:
            continue

        if code in existing_codes:
            if update_existing:
                try:
                    # Update logic would go here
                    report["updated"] += 1
                except Exception as e:
                    report["errors"].append({"code": code, "error": str(e)})
            else:
                report["skipped"] += 1
        else:
            try:
                # Create the account
                account_create = MasterAccountCreate(
                    code=code,
                    description=acc_data.get('description', ''),
                    long_description=acc_data.get('long_description'),
                    type=acc_data.get('type', 'D'),
                    category=acc_data.get('category', 'Other'),
                    fs_mapping=acc_data.get('fs_mapping'),
                    parent_code=acc_data.get('parent_code') or None,
                    normal_balance=acc_data.get('normal_balance'),
                    tags=acc_data.get('tags', []),
                    default_vendors=acc_data.get('default_vendors', []),
                    regulatory_mapping=acc_data.get('regulatory_mapping'),
                    notes=acc_data.get('notes'),
                    subcategory=acc_data.get('subcategory'),
                    cash_flow_classification=acc_data.get('cash_flow_classification'),
                    cost_center=acc_data.get('cost_center'),
                    gaap_classification=acc_data.get('gaap_classification'),
                    detailed_description=acc_data.get('detailed_description'),
                )
                masterchart_service.create_account(account_create)
                report["created"] += 1
            except Exception as e:
                report["errors"].append({"code": code, "error": str(e)})

    # Rebuild hierarchy
    masterchart_service.rebuild_hierarchy()

    # Create post-apply version snapshot
    if create_version:
        version_service.create_version_snapshot(
            description=f"After applying template: {report['created']} created",
            source="template_apply",
            user_id=user_id,
            company_ucid=company_ucid,
        )

    return report

@router.get("/template/similar/{code}", summary="Get Similar Accounts", tags=["Master Chart"])
def get_similar_accounts(
    code: str,
    limit: int = Query(5, le=20),
):
    """
    Get accounts similar to a given code from the template.
    """
    from app.services.master_template_service import get_template_service
    service = get_template_service()
    
    # Get the source account
    source = service.get_template_account(code)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {code} not found"
        )
    
    # Find similar accounts by category and tags
    similar = service.search_template(category=source.get('category'))
    
    # Filter out the source account and limit
    similar = [acc for acc in similar if acc.get('code') != code][:limit]
    
    return similar


# --- COA Versioning Endpoints ---

@router.get("/versions", response_model=List[COAVersionInfo], summary="List All Versions", tags=["COA Versions"])
def list_coa_versions(
    company_ucid: Optional[str] = None,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    """
    Get all COA version snapshots.
    Pass company_ucid to get company-specific versions, or omit for master chart versions.
    """
    service = COAVersionService(db)
    return service.get_all_versions(company_ucid=company_ucid, limit=limit)


@router.get("/versions/{version_id}", response_model=COAVersionDetail, summary="Get Version Detail", tags=["COA Versions"])
def get_coa_version(version_id: UUID, db: Session = Depends(get_db)):
    """Get detailed information about a specific version including account data."""
    service = COAVersionService(db)
    version = service.get_version_by_id(version_id)
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
    return version


@router.post("/versions/{version_id}/restore", summary="Restore Version", tags=["COA Versions"])
def restore_coa_version(
    version_id: UUID,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Restore the Chart of Accounts to a previous version.
    This creates a backup of the current state before restoring.
    """
    service = COAVersionService(db)
    try:
        result = service.restore_version(version_id, user_id=user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/versions/snapshot", summary="Create Version Snapshot", tags=["COA Versions"])
def create_version_snapshot(
    description: str = "Manual snapshot",
    user_id: Optional[str] = None,
    company_ucid: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Create a manual version snapshot of the current COA state."""
    service = COAVersionService(db)
    version = service.create_version_snapshot(
        description=description,
        source="manual",
        user_id=user_id,
        company_ucid=company_ucid,
    )
    return {
        "success": True,
        "version_id": str(version.id),
        "version_number": version.version_number,
    }


@router.get("/versions/{version_id_1}/compare/{version_id_2}", summary="Compare Versions", tags=["COA Versions"])
def compare_versions(
    version_id_1: UUID,
    version_id_2: UUID,
    db: Session = Depends(get_db),
):
    """Compare two versions and return the differences."""
    service = COAVersionService(db)
    try:
        return service.compare_versions(version_id_1, version_id_2)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/import-history", summary="Get Import History", tags=["Import"])
def get_import_history(
    company_ucid: Optional[str] = None,
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
):
    """Get import operation history."""
    service = COAVersionService(db)
    return service.get_import_history(company_ucid=company_ucid, limit=limit)


# --- Import Engine Endpoints ---

@router.post("/import/preview", response_model=ImportPreviewResult, summary="Preview Import", tags=["Import"])
async def preview_import(
    file: UploadFile = File(...),
    enrich_from_template: bool = Query(True, description="Fill missing fields from master template"),
    company_ucid: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Preview import without making changes (simulation mode).
    Returns detailed preview of what would happen including:
    - Accounts to create/update/skip
    - Validation errors and warnings
    - Suggested corrections
    """
    if not file.filename.endswith(('.csv',)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported for import preview"
        )

    content = await file.read()
    engine = ImportEngine(db)
    
    try:
        result = engine.preview_import(
            content=content,
            enrich_from_template=enrich_from_template,
            company_ucid=company_ucid,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import preview failed: {str(e)}"
        )


@router.post("/import/execute", response_model=ImportResult, summary="Execute Import", tags=["Import"])
async def execute_import(
    file: UploadFile = File(...),
    enrich_from_template: bool = Query(True),
    apply_corrections: bool = Query(True, description="Apply automatic corrections"),
    skip_errors: bool = Query(False, description="Continue import even with errors"),
    create_version: bool = Query(True, description="Create version snapshot"),
    user_id: Optional[str] = None,
    company_ucid: Optional[str] = None,
    accepted_codes: Optional[str] = Query(None, description="Comma-separated codes to accept"),
    rejected_codes: Optional[str] = Query(None, description="Comma-separated codes to reject"),
    db: Session = Depends(get_db),
):
    """
    Execute the import with full options.
    - Use accepted_codes/rejected_codes to selectively import from preview
    - Creates version snapshots before and after import
    """
    if not file.filename.endswith(('.csv',)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )

    content = await file.read()
    engine = ImportEngine(db)

    # Parse comma-separated codes
    accepted = [c.strip() for c in accepted_codes.split(',')] if accepted_codes else None
    rejected = [c.strip() for c in rejected_codes.split(',')] if rejected_codes else None

    try:
        result = engine.execute_import(
            content=content,
            enrich_from_template=enrich_from_template,
            apply_corrections=apply_corrections,
            skip_errors=skip_errors,
            create_version=create_version,
            user_id=user_id,
            company_ucid=company_ucid,
            accepted_codes=accepted,
            rejected_codes=rejected,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )
