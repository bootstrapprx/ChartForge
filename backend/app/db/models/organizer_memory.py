import uuid
from sqlalchemy import Column, String, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class OrganizerMemory(Base):
    __tablename__ = "organizer_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(String, nullable=False)
    normalized_text = Column(String, nullable=False, index=True)
    chosen_category = Column(String, nullable=False)
    chosen_parent = Column(String)
    chosen_type = Column(String)
    chosen_nature = Column(String)
    source = Column(String, default="user", nullable=False) # "user", "system", "import"
    vector = Column(JSON) # For storing embeddings as a list of floats
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<OrganizerMemory(text='{self.text[:30]}...', category='{self.chosen_category}')>"
