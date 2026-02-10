import json
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from thefuzz import process

# NEW IMPORTS
from app.core.config import settings
from app.schemas.master_account import MasterAccountSchema
from . import heuristic_classifier

from app.services.organizer_ai.utils import clean_text
from app.services.organizer_ai.model import ollama_model
from app.services.organizer_ai.prompts import create_prompt
from app.services.masterchart_service import MasterChartService
from app.db.models.master_account import MasterAccount
from app.services.organizer_ai.memory import MemoryService
from app.services.organizer_ai.learning_rules import LearningRulesService


async def get_model_classification(text: str, dynamic_examples: str) -> Optional[Dict[str, Any]]:
    """
    Classifies text using the Ollama model, enriched with dynamic few-shot examples.
    Returns None if the model is unavailable or fails.
    """
    if not await ollama_model.is_available():
        return None

    prompt = create_prompt(text, dynamic_examples)
    raw_response = await ollama_model.infer(prompt)

    if not raw_response:
        return None

    try:
        model_output = json.loads(raw_response)
        model_output["raw_model_output"] = raw_response
        model_output["source"] = "ollama"
        return model_output
    except json.JSONDecodeError:
        return {"raw_model_output": raw_response, "error": "Invalid JSON from model", "source": "ollama"}

def get_heuristic_classification(
    text: str,
    master_chart: List[MasterAccountSchema]
) -> Optional[Dict[str, Any]]:
    """
    Classifies text using the heuristic fallback engine.
    """
    heuristic_result = heuristic_classifier.classify_description(text, master_chart)
    if heuristic_result:
        return {
            "category": heuristic_result.category,
            "parent": heuristic_result.parent_account_code,
            "type": heuristic_result.account_type,
            "nature": heuristic_result.financial_statement,
            "confidence": 0.7,  # Default confidence for heuristic results
            "source": "heuristic"
        }
    return None


def similarity_search(text: str, master_accounts: List[MasterAccount], limit: int = 5) -> List[Dict[str, Any]]:
    """
    Finds similar accounts from the Master Chart using fuzzy string matching.
    """
    cleaned_text = clean_text(text)
    choices = [acc.description for acc in master_accounts if acc.description]
    if not choices:
        return []
    similar_items = process.extract(cleaned_text, choices, limit=limit)
    
    results = []
    for description, score in similar_items:
        original_account = next((acc for acc in master_accounts if acc.description == description), None)
        if original_account:
            results.append({
                "code": original_account.code,
                "description": original_account.description,
                "category": original_account.category,
                "similarity_score": score / 100.0
            })
    return results

def combine_results(
    dynamic_rule_res: List[Dict[str, Any]],
    memory_res: List[Dict[str, Any]],
    main_suggestion: Optional[Dict[str, Any]], # Changed from model_res
    sim_res: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Combines results from all classifiers with a weighting system.
    'main_suggestion' can come from either the AI model or the heuristic engine.
    """
    final_result = {
        "suggested_category": None,
        "suggested_parent": None,
        "suggested_type": None,
        "suggested_nature": None,
        "confidence": 0.0,
        "similar_existing_accounts": sim_res,
        "raw_model_output": main_suggestion.get("raw_model_output") if main_suggestion else None,
        "rule_engine_flags": None,
        "error": None,
        "memory_votes": memory_res,
        "dynamic_rules_triggered": dynamic_rule_res,
        "reasoning": main_suggestion.get("reasoning") if main_suggestion else None,
        "final_weights": {}
    }

    # 1. Dynamic rules are highest priority
    if dynamic_rule_res:
        best_rule = max(dynamic_rule_res, key=lambda x: x['confidence'])
        final_result.update({
            "suggested_category": best_rule.get("suggested_category"),
            "suggested_parent": best_rule.get("suggested_parent"),
            "confidence": best_rule.get("confidence"),
            "final_weights": {"dynamic_rule": 1.0}
        })
        return final_result

    # 2. High-confidence memory match
    if memory_res and memory_res[0]['similarity_score'] > 0.9:
        best_mem = memory_res[0]
        final_result.update({
            "suggested_category": best_mem.get("chosen_category"),
            "suggested_parent": best_mem.get("chosen_parent"),
            "confidence": best_mem.get("similarity_score"),
            "final_weights": {"memory": best_mem.get("similarity_score")}
        })
        return final_result

    # 3. Main suggestion (from model or heuristic)
    if main_suggestion and main_suggestion.get("confidence", 0) > 0.7:
        final_result.update({
            "suggested_category": main_suggestion.get("category"),
            "suggested_parent": main_suggestion.get("parent"),
            "suggested_type": main_suggestion.get("type"),
            "suggested_nature": main_suggestion.get("nature"),
            "confidence": main_suggestion.get("confidence"),
            "final_weights": {main_suggestion.get("source", "suggestion"): main_suggestion.get("confidence")}
        })
        return final_result

    # Fallback logic
    if main_suggestion and "error" not in main_suggestion:
         final_result.update({
            "suggested_category": main_suggestion.get("category"),
            "suggested_parent": main_suggestion.get("parent"),
            "suggested_type": main_suggestion.get("type"),
            "suggested_nature": main_suggestion.get("nature"),
            "confidence": main_suggestion.get("confidence", 0.5), # Lower confidence
        })
    elif main_suggestion and "error" in main_suggestion:
        final_result["error"] = main_suggestion["error"]

    return final_result


class OrganizerService:
    def __init__(self, db: Session):
        self.db = db
        self.masterchart_service = MasterChartService(db)
        self.memory_service = MemoryService(db)
        self.rules_service = LearningRulesService(db)

    async def classify_description(self, text: str) -> Dict[str, Any]:
        """
        Orchestrates the enhanced classification process with a dual-mode engine.
        """
        # 1. Get all necessary data
        master_accounts_db = self.masterchart_service.get_all_accounts()
        master_accounts_schema = [MasterAccountSchema.model_validate(acc) for acc in master_accounts_db]
        
        # 2. Run classifiers
        main_suggestion: Optional[Dict[str, Any]] = None
        if settings.OLLAMA_INTEGRATION_ENABLED:
            dynamic_examples = self.memory_service.get_dynamic_few_shot_examples()
            main_suggestion = await get_model_classification(text, dynamic_examples)
        
        # If model fails or is disabled, use heuristic
        if not main_suggestion:
            main_suggestion = get_heuristic_classification(text, master_accounts_schema)

        dynamic_rule_results = self.rules_service.apply_dynamic_rules(text)
        memory_results = self.memory_service.get_similar_memory_entries(text)
        similarity_results = similarity_search(text, master_accounts_db)

        # 3. Combine the results
        final_classification = combine_results(
            dynamic_rule_res=dynamic_rule_results,
            memory_res=memory_results,
            main_suggestion=main_suggestion,
            sim_res=similarity_results
        )

        return final_classification