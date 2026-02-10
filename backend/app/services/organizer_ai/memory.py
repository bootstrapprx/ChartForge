from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any
import json

from app.db.models.organizer_memory import OrganizerMemory
from app.schemas.organizer import OrganizerMemoryCreate
from app.services.organizer_ai.utils import clean_text
from app.core.config import settings

class MemoryService:
    def __init__(self, db: Session):
        self.db = db

    def get_memory_by_id(self, memory_id: str) -> OrganizerMemory | None:
        return self.db.query(OrganizerMemory).filter(OrganizerMemory.id == memory_id).first()

    def get_all_memories(self, skip: int = 0, limit: int = 100) -> List[OrganizerMemory]:
        return self.db.query(OrganizerMemory).order_by(desc(OrganizerMemory.created_at)).offset(skip).limit(limit).all()

    def create_memory(self, memory: OrganizerMemoryCreate) -> OrganizerMemory:
        db_memory = OrganizerMemory(**memory.model_dump())
        self.db.add(db_memory)
        self.db.commit()
        self.db.refresh(db_memory)
        return db_memory

    def get_similar_memory_entries(self, text: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves memory entries similar to the input text based on token overlap.
        A more advanced implementation would use vector similarity.
        """
        cleaned_text = clean_text(text)
        search_tokens = set(cleaned_text.split())

        all_memories = self.get_all_memories(limit=1000) # Limit to recent 1000 for performance
        
        scored_memories = []
        for mem in all_memories:
            mem_tokens = set(mem.normalized_text.split())
            intersection = search_tokens.intersection(mem_tokens)
            union = search_tokens.union(mem_tokens)
            if not union:
                continue
            
            score = len(intersection) / len(union) # Jaccard similarity
            if score > 0.1: # Threshold to consider it a match
                scored_memories.append({
                    "memory": mem,
                    "score": score
                })

        # Sort by score descending
        scored_memories.sort(key=lambda x: x["score"], reverse=True)
        
        # Format for output
        return [
            {
                "text": item["memory"].text,
                "chosen_category": item["memory"].chosen_category,
                "chosen_parent": item["memory"].chosen_parent,
                "similarity_score": item["score"]
            }
            for item in scored_memories[:limit]
        ]

    def get_memory_weights(self) -> Dict[str, Any]:
        """
        Returns statistics about the memory content.
        """
        # This is a placeholder for more complex analysis.
        # For now, we can count the frequency of categories.
        all_memories = self.get_all_memories(limit=10000)
        
        category_counts = {}
        for mem in all_memories:
            cat = mem.chosen_category
            category_counts[cat] = category_counts.get(cat, 0) + 1
            
        return {
            "category_frequency": category_counts,
            "total_entries": len(all_memories)
        }

    def get_dynamic_few_shot_examples(self) -> str:
        """
        Generates a string of few-shot examples from the most recent memory entries.
        """
        recent_memories = self.get_all_memories(limit=settings.ORGANIZER_MAX_FEWSHOT)
        
        examples = []
        for mem in recent_memories:
            examples.append({
                "input": mem.text,
                "output": {
                    "category": mem.chosen_category,
                    "parent": mem.chosen_parent,
                    "type": mem.chosen_type,
                    "nature": mem.chosen_nature,
                    "confidence": 0.99, # High confidence as it's from memory
                    "reasoning": "This classification is based on a previously confirmed example from user feedback."
                }
            })
            
        if not examples:
            return ""
            
        return json.dumps(examples, indent=2)
