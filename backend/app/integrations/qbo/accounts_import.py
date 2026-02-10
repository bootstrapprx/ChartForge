from uuid import UUID
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.integrations.qbo.client import QBOClient
from app.db.models import CompanyAccount

class QBOAccountsImportService:
    def __init__(self, company_id: UUID, db: Session):
        self.company_id = company_id
        self.db = db
        self.client = QBOClient(company_id, db)

    def import_accounts(self) -> Dict[str, Any]:
        """
        Fetches the Chart of Accounts from QBO and syncs it to the
        local CompanyAccount table.
        """
        # 1. Fetch accounts from QBO
        response = self.client.query("SELECT * FROM Account MAXRESULTS 1000")
        qbo_accounts = response.get("QueryResponse", {}).get("Account", [])
        
        if not qbo_accounts:
            return {"company_id": str(self.company_id), "qbo_total": 0, "imported": 0, "skipped": 0, "errors": []}

        # 2. Clear existing data for this company
        self.db.query(CompanyAccount).filter(CompanyAccount.company_id == self.company_id).delete()
        self.db.commit()

        # 3. Normalize and insert
        accounts_to_create = []
        qbo_id_to_code_map = {acc['Id']: acc['AcctNum'] for acc in qbo_accounts if acc.get('AcctNum')}

        for acc in qbo_accounts:
            # Skip inactive accounts
            if not acc.get('Active', False):
                continue

            # Determine parent code from ParentRef
            parent_code = None
            parent_ref = acc.get('ParentRef')
            if parent_ref and parent_ref.get('value'):
                parent_id = parent_ref['value']
                parent_code = qbo_id_to_code_map.get(parent_id)

            # Normalize type
            # This is a simplification; a real implementation needs a detailed mapping
            # of QBO AccountType/SubType to our internal 'H'/'D' system.
            acc_type = 'D' if acc.get('AccountType', '').startswith('Expense') or acc.get('AccountType', '').startswith('Income') else 'H'
            if acc.get('Classification') in ['Asset', 'Liability', 'Equity']:
                acc_type = 'H' # Assume these are headers unless specified otherwise

            new_account = CompanyAccount(
                company_id=self.company_id,
                code=acc.get('AcctNum', f"QBO_ID_{acc['Id']}"), # Use QBO ID as fallback code
                description=acc['Name'],
                type=acc_type,
                parent_code=parent_code,
                json_data={
                    "qbo_id": acc['Id'],
                    "qbo_account_type": acc.get('AccountType'),
                    "qbo_account_subtype": acc.get('AccountSubType'),
                    "qbo_classification": acc.get('Classification'),
                    "qbo_fully_qualified_name": acc.get('FullyQualifiedName')
                }
            )
            accounts_to_create.append(new_account)

        self.db.bulk_save_objects(accounts_to_create)
        self.db.commit()

        return {
            "company_id": str(self.company_id),
            "qbo_total": len(qbo_accounts),
            "imported": len(accounts_to_create),
            "skipped": len(qbo_accounts) - len(accounts_to_create),
            "errors": []
        }
