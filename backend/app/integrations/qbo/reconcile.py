from uuid import UUID
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Set

from app.integrations.qbo.accounts_import import QBOAccountsImportService
from app.integrations.qbo.mapper import map_account_to_master
from app.services.masterchart_service import MasterChartService
from app.db.models import CompanyAccount, MasterAccount

class QBOReconciliationService:
    def __init__(self, company_id: UUID, db: Session):
        self.company_id = company_id
        self.db = db
        self.masterchart_service = MasterChartService(db)

    def reconcile_qbo(self) -> Dict[str, Any]:
        """
        Performs a full reconciliation between the company's QBO accounts
        and the Master Chart of Accounts.
        """
        # 1. Ensure local data is up-to-date
        importer = QBOAccountsImportService(self.company_id, self.db)
        importer.import_accounts()

        # 2. Load all necessary data
        company_accounts: List[CompanyAccount] = self.db.query(CompanyAccount).filter(CompanyAccount.company_id == self.company_id).all()
        master_accounts: List[MasterAccount] = self.masterchart_service.get_all_accounts()
        
        company_codes: Set[str] = {acc.code for acc in company_accounts}
        master_codes: Set[str] = {acc.code for acc in master_accounts}

        # 3. Compute differences
        missing_in_qbo_codes: Set[str] = master_codes - company_codes
        extra_in_qbo_codes: Set[str] = company_codes - master_codes

        missing_in_qbo = [
            {"code": m.code, "description": m.description} 
            for m in master_accounts if m.code in missing_in_qbo_codes
        ]
        extra_in_qbo = [
            {"code": c.code, "description": c.description} 
            for c in company_accounts if c.code in extra_in_qbo_codes
        ]

        # 4. Find mismatches for common accounts
        description_mismatches = []
        structure_mismatches = []
        common_codes = company_codes.intersection(master_codes)
        
        company_map = {acc.code: acc for acc in company_accounts}
        master_map = {acc.code: acc for acc in master_accounts}

        for code in common_codes:
            c_acc = company_map[code]
            m_acc = master_map[code]
            if c_acc.description != m_acc.description:
                description_mismatches.append({
                    "code": code,
                    "company_description": c_acc.description,
                    "master_description": m_acc.description
                })
            if c_acc.parent_code != m_acc.parent_code:
                structure_mismatches.append({
                    "code": code,
                    "company_parent": c_acc.parent_code,
                    "master_parent": m_acc.parent_code
                })

        # 5. Generate mapping suggestions for extra accounts
        suggested_mappings = []
        for code in extra_in_qbo_codes:
            c_acc = company_map[code]
            suggestion = map_account_to_master(c_acc, master_accounts)
            if suggestion["suggested"]:
                suggested_mappings.append({
                    "company_account": {"code": c_acc.code, "description": c_acc.description},
                    "suggestion": suggestion
                })

        return {
            "missing_in_qbo": missing_in_qbo,
            "extra_in_qbo": extra_in_qbo,
            "description_mismatches": description_mismatches,
            "structure_mismatches": structure_mismatches,
            "suggested_mappings": suggested_mappings
        }
