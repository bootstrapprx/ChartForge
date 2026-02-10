"""
Compatibility Router
Provides backward-compatible aliases for renamed/reorganized endpoints.
All endpoints are unified under /masterchart namespace.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.services.master_template_service import get_template_service
from app.services.masterchart_service import MasterChartService
from app.services.coa_version_service import COAVersionService

router = APIRouter()


# ============================================================================
# Template Endpoints (unified under /masterchart/template)
# ============================================================================

@router.get("/masterchart/template/default", summary="Get Default Template Accounts")
def get_default_template(
    search: Optional[str] = None,
    category: Optional[str] = None,
    account_type: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = Query(500, le=2000),
    offset: int = Query(0, ge=0),
):
    """Get the default master template accounts with filtering."""
    service = get_template_service()
    accounts = service.search_template(
        search=search,
        category=category,
        acc_type=account_type,
        tag=tag,
    )
    total = len(accounts)
    accounts = accounts[offset:offset + limit]
    return {"total": total, "limit": limit, "offset": offset, "accounts": accounts}


@router.get("/masterchart/template/tree", summary="Get Template as Tree")
def get_template_tree():
    """Get the master template organized as a hierarchical tree structure."""
    service = get_template_service()
    return service.get_template_as_tree()


@router.get("/masterchart/template/stats", summary="Get Template Statistics")
def get_template_stats():
    """Get statistics about the master template."""
    service = get_template_service()
    return service.get_template_stats()


@router.get("/masterchart/template/categories", summary="Get Template Categories")
def get_template_categories():
    """Get all unique categories from the template."""
    service = get_template_service()
    return service.get_categories()


@router.get("/masterchart/template/tags", summary="Get Template Tags")
def get_template_tags():
    """Get all unique tags from the template."""
    service = get_template_service()
    return service.get_all_tags()


@router.get("/masterchart/template/subcategories", summary="Get Template Subcategories")
def get_template_subcategories():
    """Get all unique subcategories from the template."""
    service = get_template_service()
    return service.get_subcategories()


@router.get("/masterchart/template/fs-mappings", summary="Get FS Mappings")
def get_template_fs_mappings():
    """Get all unique financial statement mappings."""
    service = get_template_service()
    return service.get_fs_mappings()


@router.get("/masterchart/template/account/{code}", summary="Get Template Account")
def get_template_account(code: str):
    """Get a specific account from the template by code."""
    service = get_template_service()
    account = service.get_template_account(code)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {code} not found in template"
        )
    return account


@router.get("/masterchart/template/similar/{code}", summary="Get Similar Accounts")
def get_similar_template_accounts(
    code: str,
    limit: int = Query(5, le=20),
):
    """Get accounts similar to a given code."""
    service = get_template_service()
    source = service.get_template_account(code)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {code} not found"
        )
    similar = service.search_template(category=source.get('category'))
    similar = [acc for acc in similar if acc.get('code') != code][:limit]
    return similar


@router.post("/masterchart/template/apply/{company_ucid}", summary="Apply Template to Company")
def apply_template_to_company(
    company_ucid: str,
    update_existing: bool = Query(False),
    create_version: bool = Query(True),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Apply the master template to a company's chart of accounts."""
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

    existing_accounts = masterchart_service.get_all_accounts()
    existing_codes = {acc.code for acc in existing_accounts}

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
                report["updated"] += 1
            else:
                report["skipped"] += 1
        else:
            try:
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

    masterchart_service.rebuild_hierarchy()

    if create_version:
        version_service.create_version_snapshot(
            description=f"After applying template: {report['created']} created",
            source="template_apply",
            user_id=user_id,
            company_ucid=company_ucid,
        )

    return report


@router.get("/masterchart/template/suggest", summary="Get Account Suggestions")
def get_account_suggestions(
    query: str = Query(..., min_length=2),
    category: Optional[str] = None,
    limit: int = Query(10, le=50),
):
    """Get account suggestions based on a search query."""
    service = get_template_service()
    accounts = service.search_template(search=query, category=category)
    suggestions = [
        {
            "code": acc.get("code"),
            "description": acc.get("description"),
            "category": acc.get("category"),
            "type": acc.get("type"),
            "normal_balance": acc.get("normal_balance"),
            "tags": acc.get("tags", [])[:5],
        }
        for acc in accounts[:limit]
    ]
    return suggestions


@router.get("/masterchart/template/autofill/{category}", summary="Get Autofill Suggestions")
def get_autofill_suggestions_new(category: str):
    """Get autofill field suggestions for a given category."""
    service = get_template_service()
    accounts = service.get_template_by_category(category)

    if not accounts:
        return {"category": category, "suggestions": {}}

    fs_mappings = {}
    normal_balances = {}
    subcategories = {}

    for acc in accounts:
        fs = acc.get('fs_mapping', '')
        if fs:
            fs_mappings[fs] = fs_mappings.get(fs, 0) + 1
        nb = acc.get('normal_balance', '')
        if nb:
            normal_balances[nb] = normal_balances.get(nb, 0) + 1
        sc = acc.get('subcategory', '')
        if sc:
            subcategories[sc] = subcategories.get(sc, 0) + 1

    def top_value(d: dict):
        if not d:
            return None
        return max(d.items(), key=lambda x: x[1])[0]

    return {
        "category": category,
        "suggestions": {
            "fs_mapping": top_value(fs_mappings),
            "normal_balance": top_value(normal_balances),
            "subcategory": top_value(subcategories),
            "all_fs_mappings": list(fs_mappings.keys()),
            "all_subcategories": list(subcategories.keys())[:10],
        }
    }


@router.get("/master-template/autofill/{category}", summary="[LEGACY] Get Autofill", deprecated=True)
def get_autofill_suggestions_legacy(category: str):
    """Legacy endpoint - redirects to /masterchart/template/autofill/{category}"""
    return get_autofill_suggestions_new(category)


# ============================================================================
# Legacy Aliases (for backward compatibility)
# ============================================================================

@router.get("/master-template", summary="[LEGACY] Get Template", deprecated=True)
def legacy_get_template(
    search: Optional[str] = None,
    category: Optional[str] = None,
    account_type: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = Query(500, le=2000),
    offset: int = Query(0, ge=0),
):
    """Legacy endpoint - redirects to /masterchart/template/default"""
    return get_default_template(search, category, account_type, tag, limit, offset)


@router.get("/master-template/stats", summary="[LEGACY] Get Template Stats", deprecated=True)
def legacy_get_template_stats():
    """Legacy endpoint - redirects to /masterchart/template/stats"""
    return get_template_stats()


@router.get("/master-template/tree", summary="[LEGACY] Get Template Tree", deprecated=True)
def legacy_get_template_tree():
    """Legacy endpoint - redirects to /masterchart/template/tree"""
    return get_template_tree()


@router.get("/master-template/categories", summary="[LEGACY] Get Categories", deprecated=True)
def legacy_get_categories():
    """Legacy endpoint - redirects to /masterchart/template/categories"""
    return get_template_categories()


@router.get("/master-template/tags", summary="[LEGACY] Get Tags", deprecated=True)
def legacy_get_tags():
    """Legacy endpoint - redirects to /masterchart/template/tags"""
    return get_template_tags()


@router.get("/master-template/account/{code}", summary="[LEGACY] Get Account", deprecated=True)
def legacy_get_account(code: str):
    """Legacy endpoint - redirects to /masterchart/template/account/{code}"""
    return get_template_account(code)


@router.post("/master-template/apply/{company_ucid}", summary="[LEGACY] Apply Template", deprecated=True)
def legacy_apply_template(
    company_ucid: str,
    update_existing: bool = Query(False),
    create_version: bool = Query(True),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Legacy endpoint - redirects to /masterchart/template/apply/{company_ucid}"""
    return apply_template_to_company(company_ucid, update_existing, create_version, user_id, db)


@router.get("/master-template/suggest", summary="[LEGACY] Get Suggestions", deprecated=True)
def legacy_get_suggestions(
    query: str = Query(..., min_length=2),
    category: Optional[str] = None,
    limit: int = Query(10, le=50),
):
    """Legacy endpoint - redirects to /masterchart/template/suggest"""
    return get_account_suggestions(query, category, limit)
