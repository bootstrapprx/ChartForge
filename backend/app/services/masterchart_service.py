import pandas as pd
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.models.master_account import MasterAccount
from app.schemas.master_account import MasterAccountCreate, MasterAccountUpdate
from app.services.code_generator.patterns import get_active_pattern
from app.services.code_generator.exceptions import CodeGenerationException

class MasterChartService:
    def __init__(self, db: Session):
        self.db = db
        self.pattern = get_active_pattern()

    def _get_code_generator_service(self):
        """Lazy loads the CodeGeneratorService to prevent circular imports."""
        from app.services.code_generator.service import CodeGeneratorService
        return CodeGeneratorService(self.db)

    def get_account_by_code(self, code: str) -> Optional[MasterAccount]:
        return self.db.query(MasterAccount).filter(MasterAccount.code == code).first()

    def get_all_accounts(self) -> List[MasterAccount]:
        return self.db.query(MasterAccount).order_by(MasterAccount.code).all()
    
    def get_account_by_id(self, account_id: UUID) -> Optional[MasterAccount]:
        """Get account by ID."""
        return self.db.query(MasterAccount).filter(MasterAccount.id == account_id).first()
    
    def get_categories(self) -> List[str]:
        """Get all unique categories."""
        categories = self.db.query(MasterAccount.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]

    def get_tags(self) -> List[str]:
        """Get all unique tags."""
        # Tags are stored as ARRAY(String) in Postgres, so we need to unnest or fetch all and process
        # Fetching all might be slow if many accounts, but for now it's okay
        accounts = self.db.query(MasterAccount.tags).all()
        unique_tags = set()
        for acc in accounts:
            if acc.tags:
                for tag in acc.tags:
                    unique_tags.add(tag)
        return sorted(list(unique_tags))

    def get_children(self, parent_code: str) -> List[MasterAccount]:
        """Returns a list of all direct children of a given parent code."""
        return self.db.query(MasterAccount).filter(MasterAccount.parent_code == parent_code).all()

    def build_tree(self, accounts: List[MasterAccount]) -> List[Dict[str, Any]]:
        """
        Builds a tree structure from a flat list of account models.
        Returns a list of dictionaries (compatible with MasterAccountTree schema) to avoid ORM recursion.
        """
        from app.schemas.master_account import MasterAccountTree, MasterAccountSchema
        
        # Convert all ORM objects to Pydantic models (or dicts) first
        # This breaks the SQLAlchemy relationship links for serialization
        account_map = {}
        for acc in accounts:
            # We use MasterAccountTree.model_validate to convert ORM to Pydantic
            # But we need to be careful not to trigger recursion during validation if it reads children
            # So we first convert to MasterAccountSchema (flat) then to Tree
            # Actually, simplest is to use .as_dict() or similar, but we need schema validation.
            
            # Let's create a dict representation manually or via schema, excluding children/parent
            acc_dict = MasterAccountSchema.model_validate(acc).model_dump()
            acc_dict['children'] = []
            account_map[acc.id] = acc_dict

        tree_roots = []
        for acc in accounts:
            acc_dict = account_map[acc.id]
            if acc.parent_id and acc.parent_id in account_map:
                parent = account_map[acc.parent_id]
                parent['children'].append(acc_dict)
            else:
                tree_roots.append(acc_dict)
        
        # Sort children by code
        def sort_children(nodes):
            nodes.sort(key=lambda x: x['code'])
            for node in nodes:
                if node['children']:
                    sort_children(node['children'])
                    
        sort_children(tree_roots)

        return tree_roots

    def create_account(self, account_data: MasterAccountCreate) -> MasterAccount:
        code = account_data.code
        
        if not code:
            code_generator = self._get_code_generator_service()
            try:
                generated = code_generator.generate_new_code(
                    parent_code=account_data.parent_code
                )
                code = generated["code"]
                account_data.code = code
            except CodeGenerationException as e:
                raise ValueError(f"Failed to auto-generate code: {e}")

        if self.get_account_by_code(code):
            raise ValueError(f"Account with code {code} already exists.")

        final_parent_code = self.pattern.get_parent_code(code)
        level = self.pattern.get_level_from_code(code)

        parent = None
        parent_id = None
        if final_parent_code:
            parent = self.get_account_by_code(final_parent_code)
            if parent:
                if parent.type == 'D':
                    raise ValueError(f"Cannot add a child to a Detail account (code: {parent.code}).")
                parent_id = parent.id

        account_data.parent_code = final_parent_code
        
        # Use .model_dump() but exclude 'parent_code' if it's handled by relationship
        create_data = account_data.model_dump()
        
        db_account = MasterAccount(
            **create_data,
            level=level,
            parent_id=parent_id
        )

        self.db.add(db_account)
        self.db.commit()
        self.db.refresh(db_account)
        return db_account

    def update_account(self, code: str, account_data: MasterAccountUpdate) -> Optional[MasterAccount]:
        db_account = self.get_account_by_code(code)
        if not db_account:
            return None

        if account_data.type == 'D' and self.db.query(MasterAccount).filter(MasterAccount.parent_id == db_account.id).first():
            raise ValueError("Cannot change type to 'Detail' because this account has children.")

        update_data = account_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_account, key, value)

        self.db.commit()
        self.db.refresh(db_account)
        return db_account

    def delete_account(self, code: str) -> bool:
        db_account = self.get_account_by_code(code)
        if not db_account:
            return False
        if self.db.query(MasterAccount).filter(MasterAccount.parent_id == db_account.id).first():
            raise ValueError("Cannot delete an account that has children.")
        self.db.delete(db_account)
        self.db.commit()
        return True

    def rebuild_hierarchy(self) -> None:
        accounts = self.get_all_accounts()
        account_map_by_code: Dict[str, MasterAccount] = {acc.code: acc for acc in accounts}
        for account in accounts:
            account.level = self.pattern.get_level_from_code(account.code)
            account.parent_code = self.pattern.get_parent_code(account.code)
            if account.parent_code and account.parent_code in account_map_by_code:
                account.parent_id = account_map_by_code[account.parent_code].id
            else:
                account.parent_id = None
        self.db.commit()

    def get_coa_stats(self) -> Dict[str, Any]:
        accounts = self.get_all_accounts()
        total_accounts = len(accounts)
        header_count = sum(1 for acc in accounts if acc.type == 'H')
        detail_count = total_accounts - header_count
        max_depth = max((acc.level for acc in accounts), default=0)
        
        orphans = [acc.code for acc in accounts if acc.parent_code and not self.get_account_by_code(acc.parent_code)]

        return {
            "total_accounts": total_accounts,
            "header_count": header_count,
            "detail_count": detail_count,
            "max_depth": max_depth,
            "orphans": len(orphans),
            "orphan_codes": orphans,
        }

    def get_accounts_as_dataframe(self) -> pd.DataFrame:
        """Returns all accounts as a pandas DataFrame."""
        import pandas as pd
        accounts = self.get_all_accounts()
        return pd.DataFrame([acc.as_dict() for acc in accounts])

    def import_default_template_if_needed(self) -> None:
        """
        Imports the default US-GAAP template from CSV if the master chart is empty.
        This is idempotent and safe to run on startup.
        """
        # Check if master chart is empty
        if self.db.query(MasterAccount).first():
            print("Master Chart is not empty. Skipping default template import.")
            return

        from app.services.master_template_service import get_template_service
        
        print("Importing default template from embedded source...")
        
        try:
            template_service = get_template_service()
            accounts = template_service.get_template_accounts()
            
            # Sort by code length to ensure parents are created before children
            # The template service returns a list of dicts, so we can sort them
            accounts.sort(key=lambda x: len(x['code']))

            # First pass: Create all accounts
            for row in accounts:
                # Tags are already a list in the service output, but MasterAccountCreate expects list
                # The service _parse_csv_row returns 'tags' as list.
                
                if not row.get('code') or not row.get('type') or not row.get('category'):
                    continue

                from datetime import date
                
                account_data = MasterAccountCreate(
                    code=row['code'],
                    description=row['description'],
                    long_description=row.get('long_description'),
                    type=row['type'],
                    category=row['category'],
                    normal_balance=row['normal_balance'] or None,
                    parent_code=row.get('parent_code') or None,
                    tags=row.get('tags', []),
                    regulatory_mapping=row.get('regulatory_mapping'),
                    subcategory=row.get('subcategory'),
                    cash_flow_classification=row.get('cash_flow_classification'),
                    gaap_classification=row.get('gaap_classification'),
                    detailed_description=row.get('detailed_description'),
                    start_date=date.today(), # Default start date to satisfy DB constraint
                )
                
                try:
                    self.create_account(account_data)
                except ValueError as e:
                    print(f"Error creating account {row['code']}: {e}")
                    pass
            
            print("Default template import completed successfully.")
            
        except Exception as e:
            print(f"Failed to import default template: {e}")
            self.db.rollback()

    