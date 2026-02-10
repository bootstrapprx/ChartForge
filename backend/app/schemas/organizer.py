from pydantic import BaseModel, UUID4
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Ingestion Schemas ---

class IngestRequest(BaseModel):
    text: str
    confirmed_category: str
    confirmed_parent: Optional[str] = None
    confirmed_type: Optional[str] = None
    confirmed_nature: Optional[str] = None
    source: str = "user"

# --- Feedback Schemas ---

class FeedbackRequest(BaseModel):
    text: str
    chosen_category: str
    chosen_parent: Optional[str] = None
    chosen_type: Optional[str] = None
    chosen_nature: Optional[str] = None

# --- Memory Schemas ---

class OrganizerMemoryBase(BaseModel):
    text: str
    normalized_text: str
    chosen_category: str
    chosen_parent: Optional[str] = None
    chosen_type: Optional[str] = None
    chosen_nature: Optional[str] = None
    source: str

class OrganizerMemoryCreate(OrganizerMemoryBase):
    pass

class OrganizerMemorySchema(OrganizerMemoryBase):
    id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

# --- Rule Schemas ---

class OrganizerRuleBase(BaseModel):
    rule_pattern: str
    suggested_category: str
    suggested_parent: Optional[str] = None
    confidence: float

class OrganizerRuleCreate(OrganizerRuleBase):
    pass

class OrganizerRuleSchema(OrganizerRuleBase):
    id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

# --- Classifier Schemas ---

class ClassificationResponseExtended(BaseModel):
    suggested_category: Optional[str] = None
    suggested_parent: Optional[str] = None
    suggested_type: Optional[str] = None
    suggested_nature: Optional[str] = None
    confidence: float
    similar_existing_accounts: List[Dict[str, Any]]
    raw_model_output: Optional[str] = None
    rule_engine_flags: Optional[List[str]] = None
    error: Optional[str] = None
    memory_votes: List[Dict[str, Any]] = []
    dynamic_rules_triggered: List[Dict[str, Any]] = []
    reasoning: Optional[str] = None
    final_weights: Dict[str, float] = {}
