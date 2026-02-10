"""
Import Engine Service
Enhanced import functionality with preview/simulation mode, duplicate detection,
structural corrections, and automatic parent-child reconciliation.
"""

import csv
import io
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.db.models.master_account import MasterAccount
from app.db.models.coa_version import COAVersion, ImportHistory
from app.schemas.master_account import (
    MasterAccountCreate,
    ImportPreviewItem,
    ImportPreviewResult,
    ImportResult,
)
from app.services.code_generator.patterns import get_active_pattern

logger = logging.getLogger(__name__)


class ImportEngine:
    """
    Full import engine that supports:
    - Simulation mode (preview)
    - Duplicate detection
    - Structural corrections
    - Missing-field filling using template or AI
    - Automatic parent-child reconciliation
    """

    def __init__(self, db: Session):
        self.db = db
        self.pattern = get_active_pattern()
        self._template_cache: Optional[Dict[str, Dict[str, Any]]] = None

    def _load_template_cache(self) -> Dict[str, Dict[str, Any]]:
        """Load the master template into cache for field suggestions."""
        if self._template_cache is not None:
            return self._template_cache

        from app.services.master_template_service import MasterTemplateService
        template_service = MasterTemplateService()
        accounts = template_service.get_template_accounts()
        self._template_cache = {acc['code']: acc for acc in accounts}
        return self._template_cache

    def _get_existing_accounts(self) -> Dict[str, MasterAccount]:
        """Get all existing accounts indexed by code."""
        accounts = self.db.query(MasterAccount).all()
        return {acc.code: acc for acc in accounts}

    def _parse_csv_content(self, content: bytes) -> List[Dict[str, Any]]:
        """Parse CSV content into list of dictionaries."""
        decoded = content.decode('utf-8-sig')  # Handle BOM
        reader = csv.DictReader(io.StringIO(decoded))
        return list(reader)

    def _normalize_type(self, value: Optional[str]) -> str:
        """Normalize type value to H or D."""
        if not value:
            return 'D'
        value = value.strip().upper()
        if value in ['H', 'HEADER']:
            return 'H'
        return 'D'

    def _normalize_category(self, value: Optional[str]) -> str:
        """Normalize category value."""
        if not value:
            return 'Other'
        value = value.strip().title()
        valid_categories = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Cost of Goods Sold', 'Other']
        if value in valid_categories:
            return value
        # Fuzzy match
        for cat in valid_categories:
            if cat.lower() in value.lower() or value.lower() in cat.lower():
                return cat
        return value

    def _normalize_normal_balance(self, value: Optional[str], category: str) -> str:
        """Normalize normal balance, inferring from category if missing."""
        if value:
            value = value.strip().title()
            if value in ['Debit', 'Credit']:
                return value

        # Infer from category
        debit_categories = ['Asset', 'Expense', 'Cost of Goods Sold']
        if category in debit_categories:
            return 'Debit'
        return 'Credit'

    def _parse_list_field(self, value: Optional[str]) -> List[str]:
        """Parse comma-separated string into list."""
        if not value or value.strip() == '':
            return []
        return [item.strip() for item in value.split(',') if item.strip()]

    def _parse_date(self, value: Optional[str]) -> Optional[date]:
        """Parse date string to date object."""
        if not value or value.strip() == '':
            return None
        try:
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                try:
                    return datetime.strptime(value.strip(), fmt).date()
                except ValueError:
                    continue
            return None
        except Exception:
            return None

    def _validate_record(
        self,
        record: Dict[str, Any],
        existing_accounts: Dict[str, MasterAccount],
        all_codes_in_import: set,
    ) -> Tuple[str, List[str], List[str], Dict[str, Any]]:
        """
        Validate a single record and return (action, errors, warnings, corrections).
        action: 'create', 'update', 'skip', 'error'
        """
        errors = []
        warnings = []
        corrections = {}

        code = str(record.get('code', '')).strip()
        if not code:
            errors.append('Missing required field: code')
            return ('error', errors, warnings, corrections)

        description = str(record.get('description', '')).strip()
        if not description:
            errors.append('Missing required field: description')

        # Type validation
        raw_type = record.get('type', '')
        normalized_type = self._normalize_type(raw_type)
        if raw_type and normalized_type != raw_type.strip().upper()[0]:
            corrections['type'] = f"Normalized from '{raw_type}' to '{normalized_type}'"

        # Category validation
        raw_category = record.get('category', '')
        normalized_category = self._normalize_category(raw_category)
        if raw_category and normalized_category != raw_category.strip():
            corrections['category'] = f"Normalized from '{raw_category}' to '{normalized_category}'"

        # Normal balance validation
        raw_balance = record.get('normal_balance', '')
        normalized_balance = self._normalize_normal_balance(raw_balance, normalized_category)
        if not raw_balance:
            corrections['normal_balance'] = f"Inferred '{normalized_balance}' from category"

        # Parent code validation
        parent_code = str(record.get('parent_code', '')).strip() if record.get('parent_code') else None
        inferred_parent = self.pattern.get_parent_code(code)

        if parent_code and inferred_parent and parent_code != inferred_parent:
            warnings.append(f"Parent code mismatch: specified '{parent_code}' but pattern suggests '{inferred_parent}'")
            corrections['parent_code'] = f"Using pattern-inferred parent '{inferred_parent}'"

        # Check if parent exists
        effective_parent = inferred_parent or parent_code
        if effective_parent:
            if effective_parent not in existing_accounts and effective_parent not in all_codes_in_import:
                warnings.append(f"Parent account '{effective_parent}' does not exist (may be created in this import)")

        # Check hierarchy rules
        if normalized_type == 'D':
            # Detail accounts should not be parents
            children_in_import = [c for c in all_codes_in_import if self.pattern.get_parent_code(c) == code]
            if children_in_import:
                warnings.append(f"Detail account has children in import: {children_in_import[:3]}...")

        # Determine action
        if errors:
            return ('error', errors, warnings, corrections)

        if code in existing_accounts:
            return ('update', errors, warnings, corrections)
        else:
            return ('create', errors, warnings, corrections)

    def _enrich_from_template(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich record with missing fields from template."""
        template_cache = self._load_template_cache()
        code = record.get('code', '')

        if code in template_cache:
            template_acc = template_cache[code]
            # Only fill missing fields
            for field in ['long_description', 'regulatory_mapping', 'subcategory',
                         'cash_flow_classification', 'cost_center', 'gaap_classification',
                         'detailed_description', 'tags', 'default_vendors']:
                if not record.get(field) and template_acc.get(field):
                    record[field] = template_acc[field]

        return record

    def preview_import(
        self,
        content: bytes,
        enrich_from_template: bool = True,
        company_ucid: Optional[str] = None,
    ) -> ImportPreviewResult:
        """
        Preview import without making changes (simulation mode).
        Returns detailed preview of what would happen.
        """
        records = self._parse_csv_content(content)
        existing_accounts = self._get_existing_accounts()
        all_codes_in_import = {str(r.get('code', '')).strip() for r in records if r.get('code')}

        items: List[ImportPreviewItem] = []
        to_create = 0
        to_update = 0
        to_skip = 0
        error_count = 0
        warning_count = 0

        for record in records:
            code = str(record.get('code', '')).strip()
            description = str(record.get('description', '')).strip()

            if enrich_from_template:
                record = self._enrich_from_template(record)

            action, errors, warnings, corrections = self._validate_record(
                record, existing_accounts, all_codes_in_import
            )

            if action == 'create':
                to_create += 1
            elif action == 'update':
                to_update += 1
            elif action == 'skip':
                to_skip += 1
            elif action == 'error':
                error_count += 1

            if warnings:
                warning_count += len(warnings)

            # Calculate changes for updates
            changes = None
            if action == 'update' and code in existing_accounts:
                existing = existing_accounts[code]
                changes = {}
                if record.get('description') and record['description'] != existing.description:
                    changes['description'] = {'old': existing.description, 'new': record['description']}
                if record.get('category') and self._normalize_category(record['category']) != existing.category:
                    changes['category'] = {'old': existing.category, 'new': self._normalize_category(record['category'])}
                if record.get('type') and self._normalize_type(record['type']) != existing.type:
                    changes['type'] = {'old': existing.type, 'new': self._normalize_type(record['type'])}

            items.append(ImportPreviewItem(
                code=code,
                description=description,
                action=action,
                changes=changes,
                errors=errors if errors else None,
                warnings=warnings if warnings else None,
                suggested_corrections=corrections if corrections else None,
            ))

        validation_summary = {
            'total_records': len(records),
            'valid_records': to_create + to_update,
            'invalid_records': error_count,
            'duplicate_codes': len([i for i in items if i.action == 'update']),
            'orphan_accounts': len([i for i in items if i.warnings and any('Parent account' in w for w in i.warnings)]),
            'hierarchy_issues': len([i for i in items if i.warnings and any('Detail account has children' in w for w in i.warnings)]),
        }

        return ImportPreviewResult(
            total_records=len(records),
            to_create=to_create,
            to_update=to_update,
            to_skip=to_skip,
            errors=error_count,
            warnings=warning_count,
            items=items,
            validation_summary=validation_summary,
        )

    def execute_import(
        self,
        content: bytes,
        enrich_from_template: bool = True,
        apply_corrections: bool = True,
        skip_errors: bool = False,
        create_version: bool = True,
        user_id: Optional[str] = None,
        company_ucid: Optional[str] = None,
        accepted_codes: Optional[List[str]] = None,  # If None, import all valid
        rejected_codes: Optional[List[str]] = None,
    ) -> ImportResult:
        """
        Execute the import with options for selective acceptance.
        Creates a version snapshot before making changes.
        """
        records = self._parse_csv_content(content)
        existing_accounts = self._get_existing_accounts()
        all_codes_in_import = {str(r.get('code', '')).strip() for r in records if r.get('code')}

        # Create version snapshot before import
        version_id = None
        if create_version:
            version_id = self._create_version_snapshot(
                description="Before import",
                source="import",
                user_id=user_id,
                company_ucid=company_ucid,
            )

        created = 0
        updated = 0
        skipped = 0
        errors: List[Dict[str, Any]] = []

        rejected_set = set(rejected_codes) if rejected_codes else set()
        accepted_set = set(accepted_codes) if accepted_codes else None

        for record in records:
            code = str(record.get('code', '')).strip()

            # Skip if rejected
            if code in rejected_set:
                skipped += 1
                continue

            # Skip if not in accepted list (when provided)
            if accepted_set is not None and code not in accepted_set:
                skipped += 1
                continue

            if enrich_from_template:
                record = self._enrich_from_template(record)

            action, err_list, warn_list, corrections = self._validate_record(
                record, existing_accounts, all_codes_in_import
            )

            if action == 'error':
                if skip_errors:
                    errors.append({'code': code, 'errors': err_list})
                    skipped += 1
                    continue
                else:
                    errors.append({'code': code, 'errors': err_list})
                    continue

            try:
                if action == 'create':
                    self._create_account(record, apply_corrections)
                    created += 1
                elif action == 'update':
                    self._update_account(code, record, apply_corrections)
                    updated += 1
            except Exception as e:
                errors.append({'code': code, 'error': str(e)})
                logger.error(f"Import error for {code}: {e}")

        # Commit all changes
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            return ImportResult(
                success=False,
                created=0,
                updated=0,
                skipped=skipped,
                errors=[{'error': f'Database commit failed: {str(e)}'}],
                version_id=None,
            )

        # Rebuild hierarchy after import
        self._rebuild_hierarchy()

        # Create post-import version
        if create_version:
            post_version_id = self._create_version_snapshot(
                description=f"After import: {created} created, {updated} updated",
                source="import",
                user_id=user_id,
                company_ucid=company_ucid,
            )

        # Log import history
        self._log_import(
            filename="upload",
            source_type="csv",
            total_records=len(records),
            created=created,
            updated=updated,
            skipped=skipped,
            errors_count=len(errors),
            import_log={'errors': errors},
            version_id=version_id,
            company_ucid=company_ucid,
        )

        return ImportResult(
            success=len(errors) == 0,
            created=created,
            updated=updated,
            skipped=skipped,
            errors=errors,
            version_id=version_id,
        )

    def _create_account(self, record: Dict[str, Any], apply_corrections: bool = True) -> MasterAccount:
        """Create a new account from record data."""
        code = str(record.get('code', '')).strip()
        description = str(record.get('description', '')).strip()
        category = self._normalize_category(record.get('category', ''))
        acc_type = self._normalize_type(record.get('type', ''))
        normal_balance = self._normalize_normal_balance(record.get('normal_balance', ''), category)

        # Get parent info
        parent_code = self.pattern.get_parent_code(code) if apply_corrections else record.get('parent_code')
        level = self.pattern.get_level_from_code(code)

        # Find parent
        parent_id = None
        if parent_code:
            parent = self.db.query(MasterAccount).filter(MasterAccount.code == parent_code).first()
            if parent:
                parent_id = parent.id

        account = MasterAccount(
            code=code,
            description=description,
            long_description=record.get('long_description'),
            type=acc_type,
            category=category,
            fs_mapping=record.get('fs_mapping'),
            parent_code=parent_code,
            normal_balance=normal_balance,
            tags=self._parse_list_field(record.get('tags')),
            default_vendors=self._parse_list_field(record.get('default_vendors')),
            regulatory_mapping=record.get('regulatory_mapping'),
            start_date=self._parse_date(record.get('start_date')),
            end_date=self._parse_date(record.get('end_date')),
            notes=record.get('notes'),
            subcategory=record.get('subcategory'),
            cash_flow_classification=record.get('cash_flow_classification'),
            cost_center=record.get('cost_center'),
            gaap_classification=record.get('gaap_classification'),
            detailed_description=record.get('detailed_description'),
            level=level,
            parent_id=parent_id,
        )

        self.db.add(account)
        return account

    def _update_account(self, code: str, record: Dict[str, Any], apply_corrections: bool = True) -> Optional[MasterAccount]:
        """Update an existing account."""
        account = self.db.query(MasterAccount).filter(MasterAccount.code == code).first()
        if not account:
            return None

        # Update fields if provided
        if record.get('description'):
            account.description = record['description']
        if record.get('long_description'):
            account.long_description = record['long_description']
        if record.get('type'):
            account.type = self._normalize_type(record['type'])
        if record.get('category'):
            account.category = self._normalize_category(record['category'])
        if record.get('fs_mapping'):
            account.fs_mapping = record['fs_mapping']
        if record.get('normal_balance'):
            account.normal_balance = self._normalize_normal_balance(record['normal_balance'], account.category)
        if record.get('tags'):
            account.tags = self._parse_list_field(record['tags'])
        if record.get('default_vendors'):
            account.default_vendors = self._parse_list_field(record['default_vendors'])
        if record.get('regulatory_mapping'):
            account.regulatory_mapping = record['regulatory_mapping']
        if record.get('notes'):
            account.notes = record['notes']
        if record.get('subcategory'):
            account.subcategory = record['subcategory']
        if record.get('cash_flow_classification'):
            account.cash_flow_classification = record['cash_flow_classification']
        if record.get('cost_center'):
            account.cost_center = record['cost_center']
        if record.get('gaap_classification'):
            account.gaap_classification = record['gaap_classification']
        if record.get('detailed_description'):
            account.detailed_description = record['detailed_description']

        account.version += 1
        return account

    def _rebuild_hierarchy(self):
        """Rebuild parent-child relationships."""
        accounts = self.db.query(MasterAccount).all()
        account_map = {acc.code: acc for acc in accounts}

        for account in accounts:
            account.level = self.pattern.get_level_from_code(account.code)
            inferred_parent = self.pattern.get_parent_code(account.code)
            account.parent_code = inferred_parent
            if inferred_parent and inferred_parent in account_map:
                account.parent_id = account_map[inferred_parent].id
            else:
                account.parent_id = None

    def _create_version_snapshot(
        self,
        description: str,
        source: str,
        user_id: Optional[str] = None,
        company_ucid: Optional[str] = None,
    ) -> uuid.UUID:
        """Create a version snapshot of current COA state."""
        accounts = self.db.query(MasterAccount).all()

        # Get current max version number
        max_version = self.db.query(COAVersion).filter(
            COAVersion.company_ucid == company_ucid
        ).count()

        accounts_data = [acc.as_dict() for acc in accounts]

        version = COAVersion(
            version_number=max_version + 1,
            created_by=user_id,
            description=description,
            account_count=len(accounts),
            accounts_data=accounts_data,
            source=source,
            company_ucid=company_ucid,
        )

        self.db.add(version)
        self.db.flush()  # Get the ID
        return version.id

    def _log_import(
        self,
        filename: str,
        source_type: str,
        total_records: int,
        created: int,
        updated: int,
        skipped: int,
        errors_count: int,
        import_log: Dict[str, Any],
        version_id: Optional[uuid.UUID],
        company_ucid: Optional[str],
    ):
        """Log import operation to history."""
        history = ImportHistory(
            filename=filename,
            source_type=source_type,
            total_records=total_records,
            created=created,
            updated=updated,
            skipped=skipped,
            errors=errors_count,
            import_log=import_log,
            version_id=version_id,
            company_ucid=company_ucid,
        )
        self.db.add(history)

