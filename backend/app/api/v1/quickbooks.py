import uuid
from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse

from app.services.quickbooks_service import qbo_service
from app.core.security import create_access_token

router = APIRouter()

@router.get("/quickbooks/authorize")
def authorize_quickbooks():
    state = str(uuid.uuid4())
    # In a real app, you'd save this state to validate the callback
    auth_url = qbo_service.get_authorization_url(state)
    return RedirectResponse(url=auth_url)

@router.get("/quickbooks/callback")
async def quickbooks_callback(request: Request, code: str, state: str, realmId: str):
    # Here, you should validate the 'state' parameter
    token_data = await qbo_service.exchange_code_for_token(code)
    
    # Create an internal access token for your frontend to use
    internal_token = create_access_token(data={"sub": realmId})
    
    # Redirect to frontend with token (or handle differently)
    # This is a simple example; a real app might use a more secure flow
    return {"message": "Authorization successful", "realmId": realmId, "access_token": internal_token}

@router.get("/quickbooks/accounts")
async def get_qbo_accounts(realm_id: str):
    # In a real app, you'd get the realm_id from a logged-in user's session
    accounts = await qbo_service.get_accounts(realm_id)
    return accounts
