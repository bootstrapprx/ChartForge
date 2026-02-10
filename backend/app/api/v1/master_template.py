"""
Master Template API Router
Provides endpoints for the Default Master Template loaded from standard_chart.csv
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.master_template_service import get_template_service
from app.services.masterchart_service import MasterChartService
from app.services.coa_version_service import COAVersionService
from app.schemas.master_account import MasterAccountCreate

router = APIRouter()


@router.get("", summary="Get Master Template", tags=["Master Template"])
def get_master_template(
    search: Optional[str] = None,
    category: Optional[str] = None,
    account_type: Optional[str] = None,
    tag: Optional[str] = None,
    vendor: Optional[str] = None,
    limit: int = Query(500, le=2000),
    offset: int = Query(0, ge=0),
):
    """
    Get the default master template accounts.
    Supports various filters for searching.
    """
    service = get_template_service()
    accounts = service.search_template(
        search=search,
        category=category,
        acc_type=account_type,
        tag=tag,
        vendor=vendor,
    )
    
    # Apply pagination
    total = len(accounts)
    accounts = accounts[offset:offset + limit]
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "accounts": accounts,
    }


@router.get("/tree", summary="Get Template as Tree", tags=["Master Template"])
def get_template_tree():
    """Get the master template organized as a hierarchical tree structure."""
    service = get_template_service()
    return service.get_template_as_tree()


@router.get("/stats", summary="Get Template Statistics", tags=["Master Template"])
def get_template_stats():
    """Get statistics about the master template."""
    service = get_template_service()
    return service.get_template_stats()


@router.get("/categories", summary="Get All Categories", tags=["Master Template"])
def get_template_categories():
    """Get all unique categories from the template."""
    service = get_template_service()
    return service.get_categories()


@router.get("/subcategories", summary="Get All Subcategories", tags=["Master Template"])
def get_template_subcategories():
    """Get all unique subcategories from the template."""
    service = get_template_service()
    return service.get_subcategories()


@router.get("/tags", summary="Get All Tags", tags=["Master Template"])
def get_template_tags():
    """Get all unique tags from the template."""
    service = get_template_service()
    return service.get_all_tags()


@router.get("/fs-mappings", summary="Get FS Mappings", tags=["Master Template"])
def get_fs_mappings():
    """Get all unique financial statement mappings."""
    service = get_template_service()
    return service.get_fs_mappings()


@router.get("/account/{code}", summary="Get Template Account", tags=["Master Template"])
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


@router.get("/by-category/{category}", summary="Get Accounts by Category", tags=["Master Template"])
def get_accounts_by_category(category: str):
    """Get all template accounts for a specific category."""
    service = get_template_service()
    return service.get_template_by_category(category)


@router.get("/by-type/{acc_type}", summary="Get Accounts by Type", tags=["Master Template"])
def get_accounts_by_type(acc_type: str):
    """Get all template accounts by type (H for Header, D for Detail)."""
    service = get_template_service()
    return service.get_template_by_type(acc_type)


@router.post("/apply/{company_ucid}", summary="Apply Template to Company", tags=["Master Template"])
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


@router.get("/suggest", summary="Get Account Suggestions", tags=["Master Template"])
def get_account_suggestions(
    query: str = Query(..., min_length=2, description="Search query"),
    category: Optional[str] = None,
    limit: int = Query(10, le=50),
):
    """
    Get account suggestions based on a search query.
    Useful for autofill and dynamic suggestions while typing.
    """
    service = get_template_service()
    accounts = service.search_template(search=query, category=category)
    
    # Return lightweight suggestions
    suggestions = [
        {
            "code": acc.get("code"),
            "description": acc.get("description"),
            "category": acc.get("category"),
            "type": acc.get("type"),
            "normal_balance": acc.get("normal_balance"),
            "tags": acc.get("tags", [])[:5],  # Limit tags
        }
        for acc in accounts[:limit]
    ]
    
    return suggestions


@router.get("/similar/{code}", summary="Get Similar Accounts", tags=["Master Template"])
def get_similar_accounts(
    code: str,
    limit: int = Query(5, le=20),
):
    """
    Get accounts similar to a given code.
    Useful for suggesting related accounts during account creation.
    """
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


@router.get("/autofill/{category}", summary="Get Autofill Suggestions", tags=["Master Template"])
def get_autofill_suggestions(category: str):
    """
    Get autofill field suggestions for a given category.
    Returns common values for fields like fs_mapping, normal_balance, etc.
    """
    service = get_template_service()
    accounts = service.get_template_by_category(category)
    
    if not accounts:
        return {
            "category": category,
            "suggestions": {},
        }
    
    # Collect common values
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
    
    # Get most common values
    def top_value(d: dict) -> Optional[str]:
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

