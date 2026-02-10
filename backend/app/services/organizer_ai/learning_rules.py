from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.db.models.organizer_rules import OrganizerRule
from app.schemas.organizer import OrganizerRuleCreate
from app.services.organizer_ai.utils import clean_text
from app.db.models.organizer_memory import OrganizerMemory

class LearningRulesService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_rules(self, skip: int = 0, limit: int = 100) -> List[OrganizerRule]:
        return self.db.query(OrganizerRule).offset(skip).limit(limit).all()

    def create_rule(self, rule: OrganizerRuleCreate) -> OrganizerRule:
        # Check if a rule with the same pattern already exists
        existing_rule = self.db.query(OrganizerRule).filter(OrganizerRule.rule_pattern == rule.rule_pattern).first()
        if existing_rule:
            # Optionally update confidence or just return the existing one
            return existing_rule
            
        db_rule = OrganizerRule(**rule.model_dump())
        self.db.add(db_rule)
        self.db.commit()
        self.db.refresh(db_rule)
        return db_rule

    def apply_dynamic_rules(self, text: str) -> List[Dict[str, Any]]:
        """
        Applies all stored dynamic rules to the given text.
        """
        cleaned_text = clean_text(text)
        triggered_rules = []
        
        all_rules = self.get_all_rules(limit=1000) # Assume we don't have a huge number of rules
        
        for rule in all_rules:
            # The pattern is a simple string for now. Can be extended to regex.
            if rule.rule_pattern in cleaned_text:
                triggered_rules.append({
                    "pattern": rule.rule_pattern,
                    "suggested_category": rule.suggested_category,
                    "suggested_parent": rule.suggested_parent,
                    "confidence": rule.confidence
                })
        return triggered_rules

    def generate_rules_from_memory(self, min_confirmations: int = 3):
        """
        Analyzes memory to find patterns and generate new rules.
        This is a simplified version. A real implementation would be more complex.
        """
        # This is a placeholder for a more sophisticated rule generation engine.
        # For example, we could look for keywords that frequently appear for a certain category.
        
        # Let's try a simple approach: find if multiple memories with a common keyword
        # point to the same classification.
        
        memories = self.db.query(OrganizerMemory).limit(1000).all()
        
        # Example: Find keywords that are strongly associated with a category
        keyword_map = {} # { "keyword": { "category": count } }

        for mem in memories:
            tokens = set(mem.normalized_text.split())
            for token in tokens:
                if len(token) < 4: continue # Ignore short tokens
                
                if token not in keyword_map:
                    keyword_map[token] = {}
                
                cat = mem.chosen_category
                keyword_map[token][cat] = keyword_map[token].get(cat, 0) + 1

        # Now, create rules from this map
        for keyword, categories in keyword_map.items():
            for category, count in categories.items():
                if count >= min_confirmations:
                    # Check if this rule is better than existing ones for this keyword
                    total_occurrences = sum(categories.values())
                    confidence = count / total_occurrences
                    
                    if confidence > 0.8:
                        rule_create = OrganizerRuleCreate(
                            rule_pattern=keyword,
                            suggested_category=category,
                            confidence=confidence
                        )
                        self.create_rule(rule_create)
