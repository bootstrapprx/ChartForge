import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, nullable=True) # ID of user performing action
    action = Column(String, nullable=False) # e.g., "COMPANY_CREATE", "COMPANY_INACTIVATE"
    entity_type = Column(String, nullable=False) # e.g., "company", "mapping"
    entity_id = Column(String, nullable=True) # ID or UCID of entity
    payload = Column(JSON, nullable=True) # Details of the action
