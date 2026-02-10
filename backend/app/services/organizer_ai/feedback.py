import json
from pathlib import Path
from typing import Dict

from sqlalchemy.orm import Session
from app.schemas.organizer import FeedbackRequest, OrganizerMemoryCreate
from app.services.organizer_ai.memory import MemoryService
from app.services.organizer_ai.learning_rules import LearningRulesService
from app.services.organizer_ai.utils import clean_text

# Path to the user-learned data
DATA_PATH = Path(__file__).parent.parent.parent / "data" / "user_learned.json"


def _append_to_learned_json(data: Dict):
    """Appends a new learned classification to the JSON file."""
    learned_data = []
    if DATA_PATH.exists():
        with open(DATA_PATH, "r") as f:
            try:
                learned_data = json.load(f)
            except json.JSONDecodeError:
                pass  # If file is corrupted, we'll overwrite it

    # Avoid duplicates
    if data not in learned_data:
        learned_data.append(data)

    with open(DATA_PATH, "w") as f:
        json.dump(learned_data, f, indent=2)


class FeedbackService:
    def __init__(self, db: Session):
        self.db = db
        self.memory_service = MemoryService(db)
        self.rules_service = LearningRulesService(db)

    def confirm_classification(self, feedback: FeedbackRequest) -> dict:
        """
        Confirms a classification, adding it to memory and potentially
        triggering rule generation. Also saves it to the local JSON knowledge base.
        """
        normalized_text = clean_text(feedback.text)
        
        # 1. Save to DB memory
        memory_create = OrganizerMemoryCreate(
            text=feedback.text,
            normalized_text=normalized_text,
            chosen_category=feedback.chosen_category,
            chosen_parent=feedback.chosen_parent,
            chosen_type=feedback.chosen_type,
            chosen_nature=feedback.chosen_nature,
            source="user"
        )
        created_memory = self.memory_service.create_memory(memory_create)
        
        # 2. Save to local JSON file for heuristic classifier
        _append_to_learned_json({
            "description": feedback.text,
            "account_name": feedback.chosen_category
        })

        # 3. Trigger rule learning (can be done offline/async in a real system)
        self.rules_service.generate_rules_from_memory()
        
        return {"status": "success", "memory_id": str(created_memory.id)}

    def reject_classification(self, feedback: FeedbackRequest) -> dict:
        """
        Marks a classification as rejected.
        This can be used to penalize rules or add negative examples.
        """
        # For now, we will just add it to memory with a "rejected" source.
        # A more advanced system could use this to lower confidence of certain rules.
        normalized_text = clean_text(feedback.text)
        
        memory_create = OrganizerMemoryCreate(
            text=feedback.text,
            normalized_text=normalized_text,
            chosen_category=feedback.chosen_category,
            chosen_parent=feedback.chosen_parent,
            chosen_type=feedback.chosen_type,
            chosen_nature=feedback.chosen_nature,
            source="rejected" # Special source to indicate a negative example
        )
        created_memory = self.memory_service.create_memory(memory_create)
        
        return {"status": "rejected", "memory_id": str(created_memory.id)}
