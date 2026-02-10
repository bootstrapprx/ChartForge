import os
import requests
from uuid import UUID
from sqlalchemy.orm import Session
from app.integrations.qbo.auth import QBOAuthService

QBO_ENVIRONMENT = os.getenv("QBO_ENVIRONMENT", "sandbox")
BASE_URL = "https://sandbox-quickbooks.api.intuit.com" if QBO_ENVIRONMENT == "sandbox" else "https://quickbooks.api.intuit.com"

class QBOClient:
    """
    A reusable client for making authenticated API calls to QuickBooks Online.
    """
    def __init__(self, company_id: UUID, db: Session):
        self.company_id = company_id
        self.db = db
        self.auth_service = QBOAuthService(db)
        self._token = None
        self._session = requests.Session()
        self._prepare_session()

    def _prepare_session(self):
        """
        Retrieves the token and sets up the request session with necessary headers.
        This method includes the automatic token refresh logic.
        """
        # get_qbo_token handles the refresh logic internally
        self._token = self.auth_service.get_qbo_token(self.company_id)
        
        self._session.headers.update({
            "Authorization": f"Bearer {self._token.access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        })

    def _make_request(self, method: str, endpoint: str, **kwargs):
        """A generic request handler."""
        url = f"{BASE_URL}{endpoint}"
        try:
            response = self._session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            # Potentially handle 401 Unauthorized here with another refresh attempt
            # For now, we rely on the initial check in _prepare_session
            print(f"QBO API Error: {e.response.text}")
            raise e

    def get(self, endpoint: str, params: dict = None):
        """Performs a GET request."""
        return self._make_request("GET", endpoint, params=params)

    def post(self, endpoint: str, json: dict):
        """Performs a POST request."""
        return self._make_request("POST", endpoint, json=json)

    def query(self, qbo_sql: str) -> dict:
        """
        Performs a query using QBO's SQL-like syntax.
        Example: "SELECT * FROM Account"
        """
        endpoint = f"/v3/company/{self._token.realm_id}/query"
        return self.get(endpoint, params={"query": qbo_sql})
