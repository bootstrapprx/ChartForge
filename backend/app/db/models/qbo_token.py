import uuid
from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class QboToken(Base):
    """
    SQLAlchemy model to store OAuth2 tokens for QuickBooks Online.
    """
    __tablename__ = "qbo_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Foreign key to your main companies table
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, unique=True, index=True)
    
    realm_id = Column(String, nullable=False, index=True)
    
    # Tokens should be encrypted in a real production environment
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    
    token_type = Column(String, default="Bearer")
    expires_at = Column(DateTime, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<QboToken(company_id='{self.company_id}', realm_id='{self.realm_id}')>"
