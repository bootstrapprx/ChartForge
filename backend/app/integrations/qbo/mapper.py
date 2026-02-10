from thefuzz import fuzz
from app.db.models.company_account import CompanyAccount
from app.db.models.master_account import MasterAccount

def map_account_to_master(
    company_account: CompanyAccount,
    master_accounts: list[MasterAccount]
) -> dict:
    """
    Finds the best MasterChart match for a given CompanyAccount.
    This is a simplified version of the Merge Engine's logic, adapted for QBO.
    """
    best_match = None
    highest_score = 0.0

    for master_acc in master_accounts:
        # Code similarity
        code_sim = 1.0 if company_account.code == master_acc.code else fuzz.token_sort_ratio(company_account.code, master_acc.code) / 100.0
        
        # Description similarity
        desc_sim = fuzz.partial_ratio(company_account.description.lower(), master_acc.description.lower()) / 100.0
        
        # Type match bonus (simple version)
        type_bonus = 0.1 if company_account.type == master_acc.type else 0.0

        # QBO-specific hint: Classification
        qbo_classification = company_account.json_data.get("qbo_classification")
        category_bonus = 0.15 if qbo_classification and qbo_classification == master_acc.category else 0.0

        # Weighted average
        score = (0.4 * code_sim) + (0.35 * desc_sim) + type_bonus + category_bonus
        score = min(score, 1.0)

        if score > highest_score:
            highest_score = score
            best_match = master_acc

    if best_match:
        return {
            "candidate_master_code": best_match.code,
            "confidence": round(highest_score, 2),
            "suggested": True
        }
    
    return {"suggested": False}
