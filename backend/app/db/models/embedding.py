import uuid
from sqlalchemy import Column, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.db.base import Base

class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_ucid = Column(String, index=True, nullable=False)
    entity_type = Column(String, nullable=False) # "account", "mapping", "transaction"
    content = Column(Text, nullable=False) # The text that was embedded
    vector = Column(Vector(1536)) # Dimension for qwen2.5-coder:1.5b (hidden size)
    meta_data = Column(JSON, nullable=True) # metadata is reserved in SQLAlchemy
