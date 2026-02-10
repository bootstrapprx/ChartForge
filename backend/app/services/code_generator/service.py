from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from .patterns import get_active_pattern
from . import logic
from . import validator as code_validator
from .exceptions import *

class CodeGeneratorService:
    def __init__(self, db: Session):
        self.db = db
        self.pattern = get_active_pattern()

    def _get_masterchart_service(self):
        """Lazy loader for MasterChartService to prevent circular imports."""
        from app.services.masterchart_service import MasterChartService
        return MasterChartService(self.db)

    def generate_new_code(self, parent_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates the next valid code, either for a child or a root account.
        """
        masterchart_service = self._get_masterchart_service()
        generated_code = ""
        parent_account = None
        
        if parent_code:
            parent_account = masterchart_service.get_account_by_code(parent_code)
            if not parent_account:
                raise ParentNotFoundException(parent_code)
            
            children = masterchart_service.get_children(parent_code)
            children_codes = [c.code for c in children]
            
            generated_code = logic.get_next_child_code(
                parent_code=parent_code,
                parent_type=parent_account.type,
                parent_level=parent_account.level,
                children_codes=children_codes,
                pattern=self.pattern
            )
        else:
            all_accounts = masterchart_service.get_all_accounts()
            root_codes = [
                acc.code for acc in all_accounts 
                if self.pattern.get_level_from_code(acc.code) == 1
            ]
            generated_code = logic.get_next_root_code(root_codes, self.pattern)

        # Final validation to ensure no conflicts
        code_exists = masterchart_service.get_account_by_code(generated_code) is not None
        conflicts = code_validator.detect_code_conflicts(
            code=generated_code,
            code_exists=code_exists,
            parent_code=parent_code,
            parent_exists=True if parent_code else False, # Simplified check
            parent_type=parent_account.type if parent_code and parent_account else None,
            pattern=self.pattern
        )

        if not conflicts["is_valid"]:
            raise CodeConflictException(generated_code, message=str(conflicts["issues"]))

        return {
            "code": generated_code,
            "level": self.pattern.get_level_from_code(generated_code),
            "parent_code": parent_code,
            "pattern_used": self.pattern.pattern,
            "valid": True
        }

    def validate_code(self, code: str, parent_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Validates a given code for structure and conflicts.
        """
        masterchart_service = self._get_masterchart_service()
        
        parent_account = masterchart_service.get_account_by_code(parent_code) if parent_code else None
        parent_exists = parent_account is not None
        parent_type = parent_account.type if parent_account else None
        
        code_exists = masterchart_service.get_account_by_code(code) is not None

        return code_validator.detect_code_conflicts(
            code=code,
            code_exists=code_exists,
            parent_code=parent_code,
            parent_exists=parent_exists,
            parent_type=parent_type,
            pattern=self.pattern
        )
