import uuid
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class Snapshot(Base):
    """
    SQLAlchemy model for storing snapshots of the Chart of Accounts.
    """
    __tablename__ = "coa_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    data = Column(JSONB, nullable=False)

    def __repr__(self):
        return f"<Snapshot(id='{self.id}', created_at='{self.created_at}')>"
