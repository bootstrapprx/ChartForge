from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class Mapping(Base):
    __tablename__ = "mappings"
    id = Column(Integer, primary_key=True, index=True)
    company_account_id = Column(UUID(as_uuid=True), ForeignKey("company_accounts.id"), nullable=False)
    master_account_id = Column(UUID(as_uuid=True), ForeignKey("master_accounts.id"), nullable=False)
    score = Column(Float, nullable=False)
    status = Column(String, default="suggested") # auto, suggested, unmapped

    company_account = relationship("CompanyAccount")
    master_account = relationship("MasterAccount")
