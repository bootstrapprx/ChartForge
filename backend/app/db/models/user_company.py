"""
User-Company relationship model for access control.
Users can be assigned to companies, and only have access to companies they're part of.
"""
import uuid
from sqlalchemy import Column, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class UserCompany(Base):
    __tablename__ = "user_companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    
    # Role/permissions for this user in this company
    is_admin = Column(Boolean, default=False, nullable=False)  # Company admin (can manage company)
    can_edit = Column(Boolean, default=True, nullable=False)  # Can edit company data
    can_view = Column(Boolean, default=True, nullable=False)  # Can view company data
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="user_companies")
    company = relationship("Company", back_populates="user_companies")
    
    def __repr__(self):
        return f"<UserCompany(user_id='{self.user_id}', company_id='{self.company_id}', is_admin={self.is_admin})>"

