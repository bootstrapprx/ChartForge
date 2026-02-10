import os
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.orm import Session
from requests_oauthlib import OAuth2Session

from app.db.models.qbo_token import QboToken
from app.schemas.qbo_token import QboTokenCreate

# --- QBO Configuration ---
# These should be stored securely, e.g., in environment variables or a config service
QBO_CLIENT_ID = os.getenv("QBO_CLIENT_ID", "YOUR_QBO_CLIENT_ID")
QBO_CLIENT_SECRET = os.getenv("QBO_CLIENT_SECRET", "YOUR_QBO_CLIENT_SECRET")
QBO_REDIRECT_URI = os.getenv("QBO_REDIRECT_URI", "http://localhost:8000/api/v1/qbo/auth/callback")
QBO_ENVIRONMENT = os.getenv("QBO_ENVIRONMENT", "sandbox") # "sandbox" or "production"

DISCOVERY_DOCUMENT_URL = "https://developer.intuit.com/.well-known/openid_sandbox_configuration/" if QBO_ENVIRONMENT == "sandbox" else "https://developer.intuit.com/.well-known/openid_configuration/"

class QBOAuthService:
    def __init__(self, db: Session):
        self.db = db
        self.discovery_doc = self._get_discovery_doc()
        self.scope = ["com.intuit.quickbooks.accounting"]

    def _get_discovery_doc(self):
        # In a real app, you might cache this
        import requests
        response = requests.get(DISCOVERY_DOCUMENT_URL)
        response.raise_for_status()
        return response.json()

    def get_authorization_url(self) -> str:
        """Generates the QBO authorization URL for the user to visit."""
        oauth = OAuth2Session(client_id=QBO_CLIENT_ID, redirect_uri=QBO_REDIRECT_URI, scope=self.scope)
        authorization_url, _ = oauth.authorization_url(self.discovery_doc["authorization_endpoint"])
        return authorization_url

    def exchange_code_for_tokens(self, company_id: UUID, authorization_code: str, realm_id: str) -> QboToken:
        """Exchanges the authorization code for access and refresh tokens."""
        oauth = OAuth2Session(client_id=QBO_CLIENT_ID, redirect_uri=QBO_REDIRECT_URI)
        
        token_data = oauth.fetch_token(
            self.discovery_doc["token_endpoint"],
            code=authorization_code,
            client_secret=QBO_CLIENT_SECRET,
        )

        expires_at = datetime.utcnow() + timedelta(seconds=token_data["expires_in"])

        # Upsert token data
        db_token = self.db.query(QboToken).filter(QboToken.company_id == company_id).first()
        if not db_token:
            db_token = QboToken(company_id=company_id)
        
        db_token.realm_id = realm_id
        db_token.access_token = token_data["access_token"]
        db_token.refresh_token = token_data["refresh_token"]
        db_token.expires_at = expires_at
        db_token.token_type = token_data["token_type"]
        
        self.db.add(db_token)
        self.db.commit()
        self.db.refresh(db_token)
        
        return db_token

    def refresh_access_token(self, company_id: UUID) -> QboToken:
        """Refreshes an expired access token using the refresh token."""
        db_token = self.db.query(QboToken).filter(QboToken.company_id == company_id).first()
        if not db_token:
            raise ValueError("No QBO token found for this company.")

        oauth = OAuth2Session(client_id=QBO_CLIENT_ID, token={"refresh_token": db_token.refresh_token})
        
        new_token_data = oauth.refresh_token(
            self.discovery_doc["token_endpoint"],
            client_id=QBO_CLIENT_ID,
            client_secret=QBO_CLIENT_SECRET,
            refresh_token=db_token.refresh_token
        )

        db_token.access_token = new_token_data["access_token"]
        db_token.refresh_token = new_token_data["refresh_token"]
        db_token.expires_at = datetime.utcnow() + timedelta(seconds=new_token_data["expires_in"])
        
        self.db.commit()
        self.db.refresh(db_token)
        
        return db_token

    def get_qbo_token(self, company_id: UUID) -> QboToken:
        """Retrieves a company's QBO token, refreshing if necessary."""
        db_token = self.db.query(QboToken).filter(QboToken.company_id == company_id).first()
        if not db_token:
            raise ValueError("Company has not authenticated with QuickBooks.")
        
        # Check if token is expired or close to expiring (e.g., within 5 minutes)
        if db_token.expires_at < datetime.utcnow() + timedelta(minutes=5):
            return self.refresh_access_token(company_id)
            
        return db_token
