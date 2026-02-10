from sqlalchemy.orm import Session
from app.schemas.organizer import IngestRequest, OrganizerMemoryCreate
from app.services.organizer_ai.memory import MemoryService
from app.services.organizer_ai.utils import clean_text

class IngestService:
    def __init__(self, db: Session):
        self.db = db
        self.memory_service = MemoryService(db)

    def ingest_example(self, ingest_data: IngestRequest) -> dict:
        """
        Ingests a single confirmed example into the organizer memory.
        """
        normalized = clean_text(ingest_data.text)
        
        memory_create = OrganizerMemoryCreate(
            text=ingest_data.text,
            normalized_text=normalized,
            chosen_category=ingest_data.confirmed_category,
            chosen_parent=ingest_data.confirmed_parent,
            chosen_type=ingest_data.confirmed_type,
            chosen_nature=ingest_data.confirmed_nature,
            source=ingest_data.source
        )
        
        created_memory = self.memory_service.create_memory(memory_create)
        
        return {"status": "success", "memory_id": str(created_memory.id)}
