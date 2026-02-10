import uuid
from sqlalchemy import Column, String, DateTime, func, Float
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class OrganizerRule(Base):
    __tablename__ = "organizer_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_pattern = Column(String, nullable=False, unique=True, index=True)
    suggested_category = Column(String, nullable=False)
    suggested_parent = Column(String)
    confidence = Column(Float, nullable=False, default=0.9)
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<OrganizerRule(pattern='{self.rule_pattern}', category='{self.suggested_category}')>"
