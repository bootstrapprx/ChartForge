from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any

from app.db.session import get_db
from app.services.organizer_ai.classifier import OrganizerService
from app.services.organizer_ai.ingest import IngestService
from app.services.organizer_ai.feedback import FeedbackService
from app.services.organizer_ai.memory import MemoryService
from app.services.organizer_ai.learning_rules import LearningRulesService
from app.schemas.organizer import (
    IngestRequest,
    FeedbackRequest,
    OrganizerMemorySchema,
    OrganizerRuleSchema,
    ClassificationResponseExtended,
)

router = APIRouter()

# --- Pydantic Schemas for API (existing) ---

class ClassifyRequest(BaseModel):
    text: str

class BulkClassifyRequest(BaseModel):
    texts: List[str]

# --- Main Classification Endpoints ---

@router.post("/classify", response_model=ClassificationResponseExtended)
async def classify_description(
    request: ClassifyRequest,
    db: Session = Depends(get_db)
):
    """
    Classifies a single accounting description using the enhanced learning engine.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    organizer_service = OrganizerService(db)
    result = await organizer_service.classify_description(request.text)
    return result

@router.post("/bulk", response_model=List[ClassificationResponseExtended])
async def bulk_classify_descriptions(
    request: BulkClassifyRequest,
    db: Session = Depends(get_db)
):
    """
    Classifies a list of accounting descriptions in bulk.
    """
    if not request.texts:
        raise HTTPException(status_code=400, detail="Input texts list cannot be empty.")

    organizer_service = OrganizerService(db)
    
    results = []
    for text in request.texts:
        if text and text.strip():
            result = await organizer_service.classify_description(text)
            results.append(result)
            
    return results

# --- Learning Engine Endpoints ---

@router.post("/ingest", status_code=201)
def ingest_manual_example(
    request: IngestRequest,
    db: Session = Depends(get_db)
):
    """
    Manually ingests a confirmed classification example into the memory.
    """
    ingest_service = IngestService(db)
    return ingest_service.ingest_example(request)

@router.post("/confirm")
def confirm_classification(
    request: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Confirms a classification, adding it to memory and reinforcing learning.
    """
    feedback_service = FeedbackService(db)
    return feedback_service.confirm_classification(request)

@router.post("/reject")
def reject_classification(
    request: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Rejects a classification, adding a negative example to memory.
    """
    feedback_service = FeedbackService(db)
    return feedback_service.reject_classification(request)

@router.get("/memory", response_model=List[OrganizerMemorySchema])
def get_memory_entries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieves entries from the organizer's memory.
    """
    memory_service = MemoryService(db)
    return memory_service.get_all_memories(skip=skip, limit=limit)

@router.get("/rules", response_model=List[OrganizerRuleSchema])
def get_dynamic_rules(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieves the dynamically learned classification rules.
    """
    rules_service = LearningRulesService(db)
    return rules_service.get_all_rules(skip=skip, limit=limit)