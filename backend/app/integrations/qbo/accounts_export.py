from uuid import UUID
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.integrations.qbo.client import QBOClient
from app.services.masterchart_service import MasterChartService

# This mapping is crucial and may need to be more sophisticated
# based on the full list of QBO AccountTypes and SubTypes.
def _map_mcoa_to_qbo_type(mcoa_category: str, mcoa_type: str) -> Dict[str, str]:
    """Maps our internal category/type to QBO's AccountType and AccountSubType."""
    if mcoa_category == "Asset":
        return {"AccountType": "Bank", "AccountSubType": "Checking"} # Simplification
    if mcoa_category == "Liability":
        return {"AccountType": "Accounts Payable", "AccountSubType": "AccountsPayable"}
    if mcoa_category == "Equity":
        return {"AccountType": "Equity", "AccountSubType": "OwnersEquity"}
    if mcoa_category == "Revenue":
        return {"AccountType": "Income", "AccountSubType": "SalesOfProductIncome"}
    if mcoa_category == "Expense":
        return {"AccountType": "Expense", "AccountSubType": "AdvertisingPromotional"}
    
    # Fallback
    return {"AccountType": "Expense", "AccountSubType": "OtherMiscellaneousServiceCost"}


class QBOAccountsExportService:
    def __init__(self, company_id: UUID, db: Session):
        self.company_id = company_id
        self.db = db
        self.client = QBOClient(company_id, db)
        self.masterchart_service = MasterChartService(db)

    def publish_masterchart_to_qbo(self) -> Dict[str, Any]:
        """
        Publishes the Master Chart of Accounts to QuickBooks Online,
        creating any accounts that do not already exist.
        """
        # 1. Get existing QBO accounts to prevent duplicates
        qbo_accounts_response = self.client.query("SELECT Id, AcctNum FROM Account MAXRESULTS 1000")
        existing_qbo_codes = {
            acc['AcctNum'] for acc in qbo_accounts_response.get("QueryResponse", {}).get("Account", []) if acc.get('AcctNum')
        }
        qbo_name_to_id_map = {
            acc['Name']: acc['Id'] for acc in qbo_accounts_response.get("QueryResponse", {}).get("Account", [])
        }

        # 2. Get MCoA tree
        mcoa_tree = self.masterchart_service.get_account_tree()

        report = {"exported": 0, "skipped": 0, "errors": []}
        
        # 3. Use a breadth-first approach to create parents before children
        accounts_to_process = list(mcoa_tree)
        
        while accounts_to_process:
            account = accounts_to_process.pop(0)
            
            # If account code already exists in QBO, skip it
            if account.code in existing_qbo_codes:
                report['skipped'] += 1
                # Add children to the queue to be processed
                if account.children:
                    accounts_to_process.extend(account.children)
                continue

            # 4. Map to QBO payload
            qbo_type_info = _map_mcoa_to_qbo_type(account.category, account.type)
            payload = {
                "Name": account.description,
                "AcctNum": account.code,
                "Description": account.notes or account.description,
                **qbo_type_info
            }

            # 5. Handle parent reference
            if account.parent:
                # Find the QBO ID of the parent account
                parent_qbo_id = qbo_name_to_id_map.get(account.parent.description)
                if parent_qbo_id:
                    payload["ParentRef"] = {"value": parent_qbo_id}
                else:
                    # This can happen if parent was skipped or failed; log error
                    report['errors'].append({"code": account.code, "error": f"Parent '{account.parent.description}' not found in QBO."})
                    continue # Skip this account as its parent can't be linked

            # 6. Create account in QBO
            try:
                response = self.client.post(f"/v3/company/{self.client._token.realm_id}/account", json=payload)
                report['exported'] += 1
                # Add the newly created account to our map for child linking
                new_qbo_id = response['Account']['Id']
                qbo_name_to_id_map[account.description] = new_qbo_id
                existing_qbo_codes.add(account.code)

                # Add children to the queue
                if account.children:
                    accounts_to_process.extend(account.children)
            except Exception as e:
                report['errors'].append({"code": account.code, "error": str(e)})

        return report
