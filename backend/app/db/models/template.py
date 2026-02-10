import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class Template(Base):
    """
    SQLAlchemy model for storing custom Chart of Accounts templates.
    """
    __tablename__ = "coa_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    version = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    data = Column(JSONB, nullable=False)

    def __repr__(self):
        return f"<Template(name='{self.name}', version='{self.version}')>"
