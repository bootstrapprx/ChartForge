import difflib
from sqlalchemy.orm import Session

from app.db.models.company_account import CompanyAccount
from app.db.models.master_account import MasterAccount
from app.db.models.mapping import Mapping

def run_auto_mapping(db: Session, company_id: int):
    company_accounts = db.query(CompanyAccount).filter(CompanyAccount.company_id == company_id).all()
    master_accounts = db.query(MasterAccount).all()

    master_account_descriptions = [acc.description for acc in master_accounts]
    master_map = {acc.description: acc for acc in master_accounts}

    mappings_created = 0
    for comp_acc in company_accounts:
        # Find the best match using difflib
        matches = difflib.get_close_matches(comp_acc.description, master_account_descriptions, n=1, cutoff=0.6)
        
        if matches:
            best_match_desc = matches[0]
            master_acc = master_map[best_match_desc]
            
            # Calculate score
            score = difflib.SequenceMatcher(None, comp_acc.description, best_match_desc).ratio()
            
            status = "suggested"
            if score >= 0.85:
                status = "auto"

            # Check if a mapping already exists
            existing_mapping = db.query(Mapping).filter(
                Mapping.company_account_id == comp_acc.id
            ).first()

            if not existing_mapping:
                mapping = Mapping(
                    company_account_id=comp_acc.id,
                    master_account_id=master_acc.id,
                    score=score,
                    status=status
                )
                db.add(mapping)
                mappings_created += 1

    db.commit()
    return {"message": f"Auto-mapping complete. {mappings_created} new mappings created."}
