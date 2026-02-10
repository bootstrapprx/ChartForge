import uuid
from sqlalchemy import Column, String, DateTime, func, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class AccountMapping(Base):
    """
    SQLAlchemy model to store mapping suggestions and results between
    a CompanyAccount and a MasterAccount.
    """
    __tablename__ = "account_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    company_account_id = Column(UUID(as_uuid=True), ForeignKey("company_accounts.id"), nullable=False)
    company_account = relationship("CompanyAccount")

    # Storing the master_code directly as requested, for simplicity.
    # For higher normalization, this could be a ForeignKey to master_accounts.id
    master_code = Column(String, index=True, nullable=True)
    
    confidence = Column(Float, nullable=False)
    # Status can be 'suggested', 'confirmed', 'rejected', 'manual_review'
    status = Column(String, nullable=False, default="suggested", index=True)
    
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<AccountMapping(company_id='{self.company_account_id}', master_code='{self.master_code}', status='{self.status}')>"
