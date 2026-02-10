"""
COA Version Service
Manages Chart of Accounts version snapshots for version control and rollback.
"""

import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.models.coa_version import COAVersion, ImportHistory
from app.db.models.master_account import MasterAccount
from app.schemas.master_account import COAVersionInfo, COAVersionDetail

logger = logging.getLogger(__name__)


class COAVersionService:
    """Service for managing COA version snapshots."""

    def __init__(self, db: Session):
        self.db = db

    def get_all_versions(
        self,
        company_ucid: Optional[str] = None,
        limit: int = 50,
    ) -> List[COAVersionInfo]:
        """Get all version snapshots, optionally filtered by company."""
        query = self.db.query(COAVersion)
        
        if company_ucid:
            query = query.filter(COAVersion.company_ucid == company_ucid)
        else:
            query = query.filter(COAVersion.company_ucid.is_(None))  # Master versions
        
        versions = query.order_by(COAVersion.created_at.desc()).limit(limit).all()
        
        return [
            COAVersionInfo(
                id=v.id,
                version_number=v.version_number,
                created_at=v.created_at.isoformat() if v.created_at else "",
                created_by=v.created_by,
                description=v.description,
                account_count=v.account_count,
                change_summary=v.change_summary,
            )
            for v in versions
        ]

    def get_version_by_id(self, version_id: uuid.UUID) -> Optional[COAVersionDetail]:
        """Get detailed version information including account data."""
        version = self.db.query(COAVersion).filter(COAVersion.id == version_id).first()
        if not version:
            return None

        return COAVersionDetail(
            id=version.id,
            version_number=version.version_number,
            created_at=version.created_at.isoformat() if version.created_at else "",
            created_by=version.created_by,
            description=version.description,
            account_count=version.account_count,
            change_summary=version.change_summary,
            accounts=version.accounts_data or [],
        )

    def get_version_by_number(
        self,
        version_number: int,
        company_ucid: Optional[str] = None,
    ) -> Optional[COAVersionDetail]:
        """Get version by version number."""
        query = self.db.query(COAVersion).filter(COAVersion.version_number == version_number)
        
        if company_ucid:
            query = query.filter(COAVersion.company_ucid == company_ucid)
        else:
            query = query.filter(COAVersion.company_ucid.is_(None))
        
        version = query.first()
        if not version:
            return None

        return COAVersionDetail(
            id=version.id,
            version_number=version.version_number,
            created_at=version.created_at.isoformat() if version.created_at else "",
            created_by=version.created_by,
            description=version.description,
            account_count=version.account_count,
            change_summary=version.change_summary,
            accounts=version.accounts_data or [],
        )

    def create_version_snapshot(
        self,
        description: str,
        source: str,
        user_id: Optional[str] = None,
        company_ucid: Optional[str] = None,
    ) -> COAVersion:
        """Create a new version snapshot of current COA state."""
        # Get current accounts
        accounts = self.db.query(MasterAccount).all()
        accounts_data = [acc.as_dict() for acc in accounts]

        # Get next version number
        max_version_query = self.db.query(COAVersion)
        if company_ucid:
            max_version_query = max_version_query.filter(COAVersion.company_ucid == company_ucid)
        else:
            max_version_query = max_version_query.filter(COAVersion.company_ucid.is_(None))
        
        max_version = max_version_query.count()

        # Calculate change summary (compare with previous version)
        change_summary = None
        if max_version > 0:
            prev_version = max_version_query.order_by(COAVersion.created_at.desc()).first()
            if prev_version:
                change_summary = self._calculate_changes(prev_version.accounts_data, accounts_data)

        version = COAVersion(
            version_number=max_version + 1,
            created_by=user_id,
            description=description,
            account_count=len(accounts),
            accounts_data=accounts_data,
            change_summary=change_summary,
            source=source,
            company_ucid=company_ucid,
        )

        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        
        logger.info(f"Created COA version {version.version_number} with {len(accounts)} accounts")
        return version

    def restore_version(
        self,
        version_id: uuid.UUID,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Restore the COA to a previous version state.
        Creates a new version snapshot before restoring.
        """
        # Get the version to restore
        version = self.db.query(COAVersion).filter(COAVersion.id == version_id).first()
        if not version:
            raise ValueError(f"Version {version_id} not found")

        # Create a snapshot of current state before restoring
        self.create_version_snapshot(
            description=f"Backup before restore to version {version.version_number}",
            source="restore_backup",
            user_id=user_id,
            company_ucid=version.company_ucid,
        )

        # Delete all current accounts
        self.db.query(MasterAccount).delete()

        # Restore accounts from version
        restored_count = 0
        errors = []
        
        for acc_data in version.accounts_data or []:
            try:
                # Remove fields that shouldn't be directly set
                acc_data_clean = {k: v for k, v in acc_data.items() 
                                if k not in ['id', 'children', 'company_accounts']}
                
                # Handle UUID fields
                if 'parent_id' in acc_data_clean and acc_data_clean['parent_id']:
                    # Parent IDs will be different, we'll rebuild hierarchy later
                    acc_data_clean['parent_id'] = None
                
                account = MasterAccount(**acc_data_clean)
                self.db.add(account)
                restored_count += 1
            except Exception as e:
                errors.append({'code': acc_data.get('code'), 'error': str(e)})

        # Commit and rebuild hierarchy
        self.db.commit()
        self._rebuild_hierarchy()

        # Create post-restore version
        self.create_version_snapshot(
            description=f"Restored from version {version.version_number}",
            source="restore",
            user_id=user_id,
            company_ucid=version.company_ucid,
        )

        return {
            'success': True,
            'restored_version': version.version_number,
            'accounts_restored': restored_count,
            'errors': errors,
        }

    def compare_versions(
        self,
        version_id_1: uuid.UUID,
        version_id_2: uuid.UUID,
    ) -> Dict[str, Any]:
        """Compare two versions and return differences."""
        v1 = self.db.query(COAVersion).filter(COAVersion.id == version_id_1).first()
        v2 = self.db.query(COAVersion).filter(COAVersion.id == version_id_2).first()

        if not v1 or not v2:
            raise ValueError("One or both versions not found")

        return self._calculate_changes(v1.accounts_data, v2.accounts_data)

    def _calculate_changes(
        self,
        old_accounts: List[Dict[str, Any]],
        new_accounts: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Calculate differences between two account lists."""
        old_codes = {acc['code']: acc for acc in (old_accounts or [])}
        new_codes = {acc['code']: acc for acc in (new_accounts or [])}

        added = [code for code in new_codes if code not in old_codes]
        removed = [code for code in old_codes if code not in new_codes]
        
        modified = []
        for code in set(old_codes.keys()) & set(new_codes.keys()):
            old_acc = old_codes[code]
            new_acc = new_codes[code]
            
            changes = {}
            for field in ['description', 'type', 'category', 'normal_balance', 
                         'parent_code', 'tags', 'regulatory_mapping']:
                if old_acc.get(field) != new_acc.get(field):
                    changes[field] = {
                        'old': old_acc.get(field),
                        'new': new_acc.get(field),
                    }
            
            if changes:
                modified.append({'code': code, 'changes': changes})

        return {
            'added_count': len(added),
            'removed_count': len(removed),
            'modified_count': len(modified),
            'added': added[:50],  # Limit for response size
            'removed': removed[:50],
            'modified': modified[:50],
        }

    def _rebuild_hierarchy(self):
        """Rebuild parent-child relationships after restore."""
        from app.services.code_generator.patterns import get_active_pattern
        pattern = get_active_pattern()
        
        accounts = self.db.query(MasterAccount).all()
        account_map = {acc.code: acc for acc in accounts}

        for account in accounts:
            account.level = pattern.get_level_from_code(account.code)
            inferred_parent = pattern.get_parent_code(account.code)
            account.parent_code = inferred_parent
            if inferred_parent and inferred_parent in account_map:
                account.parent_id = account_map[inferred_parent].id
            else:
                account.parent_id = None

        self.db.commit()

    def get_import_history(
        self,
        company_ucid: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Get import history records."""
        query = self.db.query(ImportHistory)
        
        if company_ucid:
            query = query.filter(ImportHistory.company_ucid == company_ucid)
        
        history = query.order_by(ImportHistory.created_at.desc()).limit(limit).all()
        
        return [
            {
                'id': str(h.id),
                'created_at': h.created_at.isoformat() if h.created_at else None,
                'created_by': h.created_by,
                'filename': h.filename,
                'source_type': h.source_type,
                'total_records': h.total_records,
                'created': h.created,
                'updated': h.updated,
                'skipped': h.skipped,
                'errors': h.errors,
                'version_id': str(h.version_id) if h.version_id else None,
            }
            for h in history
        ]

