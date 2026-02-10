import uuid
from sqlalchemy import Column, String, Date, Integer, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.db.base import Base

class MasterAccount(Base):
    """
    SQLAlchemy model for the Master Chart of Accounts.
    Updated to support the full enriched CSV structure with all fields.
    """
    __tablename__ = "master_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core fields
    code = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=False)
    long_description = Column(Text, nullable=True)
    type = Column(String(10), nullable=False)  # "Header" or "Detail"
    category = Column(String, nullable=False)  # Asset, Liability, Equity, Revenue, Expense, etc.
    fs_mapping = Column(String, nullable=True)  # Balance Sheet, Income Statement
    parent_code = Column(String, nullable=True, index=True)
    normal_balance = Column(String(10), nullable=True)  # Debit or Credit
    
    # AI-related fields
    tags = Column(ARRAY(String), nullable=True, default=list)  # list of tags for AI matching
    default_vendors = Column(ARRAY(String), nullable=True, default=list)  # default vendors for this account
    
    # Compliance fields
    regulatory_mapping = Column(Text, nullable=True)  # IFRS/GAAP references
    
    # Lifecycle fields
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Extended fields from enriched CSV
    subcategory = Column(String, nullable=True)  # More detailed categorization
    cash_flow_classification = Column(String, nullable=True)  # Operating, Investing, Financing Activities
    cost_center = Column(String, nullable=True)  # Cost center assignment
    gaap_classification = Column(String, nullable=True)  # US-GAAP specific classification
    detailed_description = Column(Text, nullable=True)  # Full detailed description from CSV
    
    # Hierarchy fields
    level = Column(Integer, nullable=False, default=0)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("master_accounts.id"), nullable=True)
    
    # Version tracking
    version = Column(Integer, nullable=False, default=1)
    
    # Self-referential relationship for parent-child hierarchy.
    parent = relationship("MasterAccount", remote_side=[id], back_populates="children")
    children = relationship("MasterAccount", back_populates="parent", cascade="all, delete-orphan")

    company_accounts = relationship("CompanyAccount", back_populates="master_account")

    def __repr__(self):
        return f"<MasterAccount(code='{self.code}', description='{self.description}')>"

    def as_dict(self):
        """Return object data in easily serializable format"""
        result = {}
        for c in self.__table__.columns:
            value = getattr(self, c.name)
            # Handle UUID serialization
            if isinstance(value, uuid.UUID):
                value = str(value)
            result[c.name] = value
        return result
    
    @property
    def is_header(self) -> bool:
        """Check if account is a header account."""
        return self.type and self.type.upper() in ['H', 'HEADER']
    
    @property
    def is_detail(self) -> bool:
        """Check if account is a detail account."""
        return self.type and self.type.upper() in ['D', 'DETAIL']
    
    @property
    def normalized_type(self) -> str:
        """Return normalized type value (H or D)."""
        if self.type:
            upper_type = self.type.upper()
            if upper_type in ['H', 'HEADER']:
                return 'H'
            elif upper_type in ['D', 'DETAIL']:
                return 'D'
        return 'D'  # Default to Detail
