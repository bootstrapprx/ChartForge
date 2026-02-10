import uuid
from sqlalchemy import Column, String, Text, Boolean, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    ucid = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    inactivated_at = Column(DateTime, nullable=True)
    inactivated_by = Column(String, nullable=True) # User ID or Name
    
    # Contact Information
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # Address Information
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Additional Information
    tax_id = Column(String, nullable=True)  # Tax ID / EIN
    industry = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    accounts = relationship("CompanyAccount", back_populates="company", cascade="all, delete-orphan")
    
    # Relationship to users (many-to-many through UserCompany)
    user_companies = relationship("UserCompany", back_populates="company", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_companies_ucid_active', 'ucid', unique=True, postgresql_where=(is_active == True)),
        Index('ix_companies_name_active', 'name', unique=True, postgresql_where=(is_active == True)),
    )