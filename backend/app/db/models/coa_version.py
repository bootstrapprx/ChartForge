import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class COAVersion(Base):
    """
    SQLAlchemy model for Chart of Accounts version snapshots.
    Stores complete snapshots of the COA for version tracking and rollback capability.
    """
    __tablename__ = "coa_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_number = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String, nullable=True)  # User ID or name
    description = Column(Text, nullable=True)  # Description of changes
    
    # Snapshot data
    account_count = Column(Integer, nullable=False, default=0)
    accounts_data = Column(JSON, nullable=False)  # Full snapshot of all accounts
    
    # Change tracking
    change_summary = Column(JSON, nullable=True)  # Summary of changes from previous version
    source = Column(String, nullable=True)  # "import", "manual", "template", "merge"
    
    # Reference to company (null for master template)
    company_ucid = Column(String, nullable=True, index=True)

    def __repr__(self):
        return f"<COAVersion(version={self.version_number}, accounts={self.account_count})>"


class ImportHistory(Base):
    """
    SQLAlchemy model for tracking import operations.
    """
    __tablename__ = "import_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String, nullable=True)
    
    # Import details
    filename = Column(String, nullable=True)
    source_type = Column(String, nullable=True)  # "csv", "json", "template"
    
    # Results
    total_records = Column(Integer, nullable=False, default=0)
    created = Column(Integer, nullable=False, default=0)
    updated = Column(Integer, nullable=False, default=0)
    skipped = Column(Integer, nullable=False, default=0)
    errors = Column(Integer, nullable=False, default=0)
    
    # Detailed log
    import_log = Column(JSON, nullable=True)
    
    # Version created
    version_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Company reference (null for master)
    company_ucid = Column(String, nullable=True, index=True)

    def __repr__(self):
        return f"<ImportHistory(created={self.created}, updated={self.updated}, errors={self.errors})>"

