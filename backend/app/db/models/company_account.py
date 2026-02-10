import uuid
from sqlalchemy import Column, String, DateTime, func, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

class CompanyAccount(Base):
    """
    SQLAlchemy model for an individual company's Chart of Accounts.
    This represents an account from a specific company's books, which can be
    mapped to a MasterAccount.
    """
    __tablename__ = "company_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    
    code = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    type = Column(String(1), nullable=False)
    parent_code = Column(String, nullable=True)
    
    name = Column(String, nullable=True)
    currency = Column(String(3), default="USD", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    master_account_code = Column(String, ForeignKey("master_accounts.code"), nullable=True, index=True)
    json_data = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    company = relationship("Company", back_populates="accounts")
    master_account = relationship("MasterAccount", back_populates="company_accounts")

    def __repr__(self):
        return f"<CompanyAccount(company_id='{self.company_id}', code='{self.code}')>"