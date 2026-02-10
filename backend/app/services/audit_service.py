from sqlalchemy.orm import Session
from app.db.models.audit_log import AuditLog
from typing import Optional, Dict, Any
import json

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None
    ):
        """
        Logs a system event to the audit_logs table.
        """
        audit_entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            payload=payload
        )
        db.add(audit_entry)
        db.commit()
