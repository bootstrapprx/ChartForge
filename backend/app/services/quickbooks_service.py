import httpx
from authlib.integrations.httpx_client import OAuth2Client
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import qbo_token_storage

class QuickBooksService:
    def __init__(self):
        # Settings are loaded, but we check for their presence before use.
        self.client_id = settings.QBO_CLIENT_ID
        self.client_secret = settings.QBO_CLIENT_SECRET
        self.redirect_uri = settings.QBO_REDIRECT_URI
        
        env = settings.QBO_ENVIRONMENT
        self.auth_url = f"https://appcenter.intuit.com/connect/oauth2"
        self.token_url = f"https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
        self.base_api_url = (
            f"https://sandbox-quickbooks.api.intuit.com"
            if env == "sandbox"
            else f"https://quickbooks.api.intuit.com"
        )

    def _check_config(self):
        """Checks if QBO integration is fully configured."""
        if not settings.QBO_INTEGRATION_ENABLED:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="QuickBooks Online integration is not configured on the server."
            )

    def get_authorization_url(self, state: str) -> str:
        self._check_config()
        scopes = "com.intuit.quickbooks.accounting"
        url = (
            f"{self.auth_url}?client_id={self.client_id}&response_type=code"
            f"&scope={scopes}&redirect_uri={self.redirect_uri}&state={state}"
        )
        return url

    async def exchange_code_for_token(self, code: str):
        self._check_config()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                auth=(self.client_id, self.client_secret),
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
            )
            response.raise_for_status()
            token_data = response.json()
            qbo_token_storage.update(token_data)
            return token_data

    def get_oauth_client(self) -> OAuth2Client:
        self._check_config()
        if not qbo_token_storage:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="QBO token not available. Please authorize first."
            )
        
        client = OAuth2Client(
            client_id=self.client_id,
            client_secret=self.client_secret,
            token_endpoint=self.token_url,
            token=qbo_token_storage,
        )
        return client

    async def get_accounts(self, realm_id: str):
        self._check_config()
        client = self.get_oauth_client()
        url = f"{self.base_api_url}/v3/company/{realm_id}/query?query=select * from Account"
        
        try:
            response = await client.get(url, headers={"Accept": "application/json"})
            response.raise_for_status()
            return response.json().get("QueryResponse", {}).get("Account", [])
        except httpx.HTTPStatusError as e:
            # Provide more context on QBO API errors
            detail = f"Error fetching accounts from QuickBooks: {e.response.text}"
            raise HTTPException(status_code=e.response.status_code, detail=detail)

# Instantiate the service
qbo_service = QuickBooksService()
