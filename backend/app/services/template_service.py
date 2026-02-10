import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session

from app.db.models.master_account import MasterAccount
from app.db.models.template import Template
from app.schemas.master_account import MasterAccountCreate
from app.schemas.template import TemplateValidationResult
from app.services.masterchart_service import MasterChartService
from app.services.code_generator.patterns import get_active_pattern

class TemplateService:
    def __init__(self, db: Session):
        self.db = db
        self.templates_dir = Path(__file__).parent.parent / "db" / "templates"
        self.pattern = get_active_pattern()

    def list_templates(self) -> List[str]:
        """Lists all available JSON template files."""
        return [f.stem for f in self.templates_dir.glob("*.json")]

    def load_template(self, template_name: str) -> Dict[str, Any]:
        """Loads a JSON template from the filesystem."""
        template_path = self.templates_dir / f"{template_name}.json"
        if not template_path.exists():
            raise FileNotFoundError(f"Template '{template_name}' not found.")
        with open(template_path, 'r') as f:
            return json.load(f)

    def validate_template(self, data: Dict[str, Any]) -> TemplateValidationResult:
        """Validates the structure and rules of a template dictionary."""
        errors: List[str] = []
        codes: Set[str] = set()

        def _validate_node(node: Dict[str, Any], parent_code: Optional[str] = None):
            code = node.get("code")
            if not code or not isinstance(code, str):
                errors.append(f"Invalid or missing code: {code}")
                return

            if code in codes:
                errors.append(f"Duplicate code found: {code}")
            codes.add(code)

            if not node.get("description"):
                errors.append(f"Missing description for code: {code}")
            
            node_type = node.get("type")
            if node_type not in ["H", "D"]:
                errors.append(f"Invalid type '{node_type}' for code: {code}")

            # Check parent-child code relationship
            inferred_p_code = self.pattern.get_parent_code(code)
            if parent_code != inferred_p_code:
                 errors.append(f"Hierarchy mismatch for code {code}. Expected parent {inferred_p_code}, found {parent_code}.")

            children = node.get("children", [])
            if node_type == "D" and children:
                errors.append(f"Detail account '{code}' cannot have children.")
            
            for child in children:
                _validate_node(child, parent_code=code)

        for root_node in data.get("root", []):
            _validate_node(root_node)

        return TemplateValidationResult(is_valid=not errors, errors=errors)

    def apply_template(self, template_name: str, update_existing: bool = False) -> Dict[str, Any]:
        """Applies a CoA template to the MasterChart."""
        template_data = self.load_template(template_name)
        validation = self.validate_template(template_data)
        if not validation.is_valid:
            raise ValueError(f"Template is invalid: {'; '.join(validation.errors)}")

        masterchart_service = MasterChartService(self.db)
        existing_accounts = masterchart_service.get_all_accounts()
        existing_codes = {acc.code for acc in existing_accounts}
        
        template_accounts: List[Dict[str, Any]] = []
        def _flatten_template(nodes: List[Dict[str, Any]]):
            for node in nodes:
                children = node.pop("children", [])
                template_accounts.append(node)
                if children:
                    _flatten_template(children)
        
        _flatten_template(template_data.get("root", []))

        report = {
            "template": template_name,
            "created": 0, "updated": 0, "skipped": 0, "errors": [],
            "missing_in_masterchart": [], "unexpected_in_masterchart": list(existing_codes)
        }

        accounts_to_create = []
        for acc_data in template_accounts:
            code = acc_data['code']
            if code in report['unexpected_in_masterchart']:
                report['unexpected_in_masterchart'].remove(code)

            if code in existing_codes:
                report['skipped'] += 1
                if update_existing:
                    # Implement update logic if needed
                    report['updated'] += 1
            else:
                # TODO: Integration point for CodeGenerator
                # If acc_data['code'] is missing or a placeholder, this is where
                # the CodeGenerator would be called. It would need to know the
                # parent's generated code to create a valid child code.
                # from app.services.code_generator.generator import CodeGenerator
                # generator = CodeGenerator(self.db)
                # generated_code = generator.generate_new_code(parent_code=..., category=...)
                # acc_data['code'] = generated_code['code']
                try:
                    # Add required fields not in all templates
                    acc_data.setdefault('start_date', '2025-01-01')
                    account_schema = MasterAccountCreate(**acc_data)
                    accounts_to_create.append(account_schema)
                    report['missing_in_masterchart'].append(code)
                except Exception as e:
                    report['errors'].append({"code": code, "error": str(e)})

        if accounts_to_create:
            try:
                for acc_schema in accounts_to_create:
                    self.db.add(MasterAccount(**acc_schema.model_dump(), level=0)) # Temp level
                self.db.commit()
                report['created'] = len(accounts_to_create)
            except Exception as e:
                self.db.rollback()
                report['errors'].append({"code": "BULK_INSERT", "error": str(e)})
        
        masterchart_service.rebuild_hierarchy()
        return report

    def save_custom_template(self, name: str, version: str, data: Dict[str, Any]) -> Template:
        """Saves a custom template to the database."""
        validation = self.validate_template(data)
        if not validation.is_valid:
            raise ValueError(f"Template is invalid: {'; '.join(validation.errors)}")
        
        template = Template(name=name, version=version, data=data)
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template
