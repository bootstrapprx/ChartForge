import json
from pathlib import Path
from typing import List, Dict, Optional

from thefuzz import process

from app.schemas.master_account import MasterAccountSchema

# Path to the user-learned data
DATA_PATH = Path(__file__).parent.parent.parent / "data" / "user_learned.json"

def load_learned_data() -> List[Dict]:
    """Loads user-corrected classifications from the JSON file."""
    if not DATA_PATH.exists():
        return []
    with open(DATA_PATH, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def classify_description(
    description: str,
    master_chart: List[MasterAccountSchema],
) -> Optional[MasterAccountSchema]:
    """
    Classifies a description using a heuristic-based approach.
    
    1. Tries to find a match in the user-learned data.
    2. Falls back to fuzzy string matching against the master chart.
    """
    learned_data = load_learned_data()
    
    # 1. Check learned data first
    if learned_data:
        learned_descriptions = [item["description"] for item in learned_data]
        best_match, score = process.extractOne(description, learned_descriptions)
        if score > 95:  # High confidence match
            matched_item = next(item for item in learned_data if item["description"] == best_match)
            account_name = matched_item["account_name"]
            # Find the corresponding account in the master chart
            for account in master_chart:
                if account.account_name == account_name:
                    return account

    # 2. Fallback to fuzzy matching on the whole master chart
    choices = {account.account_name: account for account in master_chart}
    best_match_name, score = process.extractOne(description, choices.keys())
    
    if score > 80: # Confidence threshold
        return choices[best_match_name]

    return None
