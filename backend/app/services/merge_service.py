from uuid import UUID
from sqlalchemy.orm import Session
from thefuzz import fuzz
from typing import List, Dict, Any

from app.db.models.company_account import CompanyAccount
from app.db.models.master_account import MasterAccount
from app.db.models.account_mapping import AccountMapping
from app.schemas.account_mapping import AccountMappingCreate

class MergeService:
    def __init__(self, db: Session):
        self.db = db

    def _get_company_accounts(self, company_id: UUID) -> List[CompanyAccount]:
        return self.db.query(CompanyAccount).filter(CompanyAccount.company_id == company_id).all()

    def _get_master_accounts(self) -> List[MasterAccount]:
        return self.db.query(MasterAccount).all()

    def compute_similarity(self, company_acc: CompanyAccount, master_acc: MasterAccount) -> float:
        """Computes a similarity score between a company and master account."""
        # Code similarity (exact match is best, otherwise use token sort ratio)
        code_sim = 1.0 if company_acc.code == master_acc.code else fuzz.token_sort_ratio(company_acc.code, master_acc.code) / 100.0
        
        # Description similarity using partial ratio for substring matching
        desc_sim = fuzz.partial_ratio(company_acc.description.lower(), master_acc.description.lower()) / 100.0
        
        # Type match bonus
        type_bonus = 0.1 if company_acc.type == master_acc.type else 0.0
        
        # Weighted average
        score = (0.5 * code_sim) + (0.4 * desc_sim) + type_bonus
        return min(score, 1.0)

    def suggest_mappings(self, company_id: UUID, threshold: float = 0.65) -> List[AccountMapping]:
        """Generates and stores mapping suggestions for a company."""
        company_accounts = self._get_company_accounts(company_id)
        master_accounts = self._get_master_accounts()
        
        # Clear previous suggestions
        self.db.query(AccountMapping).join(CompanyAccount).filter(CompanyAccount.company_id == company_id).delete()
        self.db.commit()

        all_suggestions = []
        for c_acc in company_accounts:
            best_match = None
            highest_score = 0.0
            
            for m_acc in master_accounts:
                score = self.compute_similarity(c_acc, m_acc)
                if score > highest_score:
                    highest_score = score
                    best_match = m_acc
            
            if best_match and highest_score >= threshold:
                suggestion = AccountMappingCreate(
                    company_account_id=c_acc.id,
                    master_code=best_match.code,
                    confidence=highest_score,
                    status="suggested",
                    notes=f"Best match found with score {highest_score:.2f}"
                )
                all_suggestions.append(suggestion)

        if all_suggestions:
            self.db.bulk_save_objects([AccountMapping(**s.model_dump()) for s in all_suggestions])
            self.db.commit()
        
        return self.db.query(AccountMapping).join(CompanyAccount).filter(CompanyAccount.company_id == company_id).all()

    def auto_merge(self, company_id: UUID, threshold: float = 0.80) -> Dict[str, int]:
        """Automatically confirms high-confidence mappings."""
        mappings_to_update = self.db.query(AccountMapping).join(CompanyAccount).filter(
            CompanyAccount.company_id == company_id,
            AccountMapping.status == 'suggested',
            AccountMapping.confidence >= threshold
        ).all()

        confirmed_count = 0
        for mapping in mappings_to_update:
            mapping.status = 'confirmed'
            confirmed_count += 1
        
        self.db.commit()
        return {"auto_confirmed_count": confirmed_count}

    def get_preview(self, company_id: UUID) -> List[Dict[str, Any]]:
        """Gets a preview of all suggested mappings for frontend display."""
        mappings = self.db.query(AccountMapping).join(CompanyAccount).filter(
            CompanyAccount.company_id == company_id,
            AccountMapping.status == 'suggested'
        ).order_by(AccountMapping.confidence.desc()).all()

        master_accounts_map = {m.code: m for m in self._get_master_accounts()}
        
        preview = []
        for m in mappings:
            master_acc = master_accounts_map.get(m.master_code)
            preview.append({
                "company_account": {
                    "id": m.company_account.id,
                    "code": m.company_account.code,
                    "description": m.company_account.description,
                },
                "suggestion": {
                    "master_code": m.master_code,
                    "master_description": master_acc.description if master_acc else "N/A",
                    "confidence": m.confidence,
                    "status": m.status,
                }
            })
        return preview

    def generate_merge_report(self, company_id: UUID) -> Dict[str, Any]:
        """Generates a comprehensive merge analysis report."""
        company_accounts = self._get_company_accounts(company_id)
        mappings = self.db.query(AccountMapping).join(CompanyAccount).filter(CompanyAccount.company_id == company_id).all()
        
        total_company_accounts = len(company_accounts)
        mapped_ids = {m.company_account_id for m in mappings}
        
        # Summary
        summary = {
            "total_company_accounts": total_company_accounts,
            "mapped": len(mapped_ids),
            "auto_confirmed": sum(1 for m in mappings if m.status == 'confirmed'),
            "manual_review_needed": sum(1 for m in mappings if m.status == 'suggested'),
            "unmapped": total_company_accounts - len(mapped_ids)
        }

        # Mappings by confidence
        high_confidence = [m for m in mappings if m.confidence >= 0.8]
        low_confidence = [m for m in mappings if m.confidence < 0.8]
        
        # Orphan accounts (unmapped)
        orphan_accounts = [acc for acc in company_accounts if acc.id not in mapped_ids]

        return {
            "company_id": str(company_id),
            "summary": summary,
            "duplicates_detected": [], # Placeholder
            "conflicts_detected": [], # Placeholder
            "missing_from_masterchart": [], # Placeholder
            "suggested_mappings": self.get_preview(company_id),
            "high_confidence_mappings": [m.master_code for m in high_confidence],
            "low_confidence_mappings": [m.master_code for m in low_confidence],
            "orphan_accounts": [{"code": acc.code, "description": acc.description} for acc in orphan_accounts]
        }
