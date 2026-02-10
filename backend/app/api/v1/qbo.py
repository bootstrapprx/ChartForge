from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.integrations.qbo.auth import QBOAuthService
from app.integrations.qbo.accounts_import import QBOAccountsImportService
from app.integrations.qbo.accounts_export import QBOAccountsExportService
from app.integrations.qbo.reconcile import QBOReconciliationService

router = APIRouter()

# --- AUTHENTICATION ---

@router.get("/auth/url", summary="Get QuickBooks Authorization URL")
def get_qbo_authorization_url(db: Session = Depends(get_db)):
    service = QBOAuthService(db)
    return {"authorization_url": service.get_authorization_url()}

@router.post("/auth/callback", summary="Handle QBO OAuth2 Callback")
def handle_qbo_callback(
    company_id: UUID = Query(...),
    code: str = Query(...),
    realmId: str = Query(...),
    db: Session = Depends(get_db)
):
    service = QBOAuthService(db)
    try:
        token = service.exchange_code_for_tokens(company_id=company_id, authorization_code=code, realm_id=realmId)
        return {"message": "QuickBooks authorization successful.", "realm_id": token.realm_id}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to exchange token: {e}")

# --- DATA SYNC ---

@router.get("/{company_id}/import", summary="Import Chart of Accounts from QBO")
def import_qbo_chart_of_accounts(company_id: UUID, db: Session = Depends(get_db)):
    try:
        service = QBOAccountsImportService(company_id, db)
        return service.import_accounts()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{company_id}/export", summary="Export Master Chart to QBO")
def export_master_chart_to_qbo(company_id: UUID, db: Session = Depends(get_db)):
    try:
        service = QBOAccountsExportService(company_id, db)
        return service.publish_masterchart_to_qbo()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# --- RECONCILIATION & MAPPING ---

@router.get("/{company_id}/reconcile", summary="Reconcile QBO Chart of Accounts")
def reconcile_with_master_chart(company_id: UUID, db: Session = Depends(get_db)):
    """
    Performs a full reconciliation between the company's imported QBO accounts
    and the Master Chart, returning a detailed report of differences and suggestions.
    """
    try:
        service = QBOReconciliationService(company_id, db)
        return service.reconcile_qbo()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{company_id}/mapping", summary="Get Mapping Suggestions Preview")
def get_mapping_suggestions(company_id: UUID, db: Session = Depends(get_db)):
    """
    A convenience endpoint that returns just the 'suggested_mappings' portion
    of the main reconciliation report.
    """
    try:
        service = QBOReconciliationService(company_id, db)
        report = service.reconcile_qbo()
        return report.get("suggested_mappings", [])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
