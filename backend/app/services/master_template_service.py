"""
Master Template Service
Loads the standard_chart.csv as the authoritative default template.
Provides endpoints to return template and apply it to companies.
"""

import csv
import io
import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from functools import lru_cache

logger = logging.getLogger(__name__)


class MasterTemplateService:
    """
    Service for managing the Default Master Template.
    Loads enriched CSV into memory at startup and provides template operations.
    """

    _instance: Optional['MasterTemplateService'] = None
    _template_data: Optional[List[Dict[str, Any]]] = None

    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_template_accounts(self) -> List[Dict[str, Any]]:
        """Get all accounts from the template using the chart library."""
        from app import chart_library
        return chart_library.get_template()

    def get_template_as_tree(self) -> List[Dict[str, Any]]:
        """Get template accounts organized as a tree structure."""
        from app import chart_library
        return chart_library.build_tree()


    def get_template_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get accounts filtered by category."""
        accounts = self.get_template_accounts()
        return [acc for acc in accounts if acc.get('category', '').lower() == category.lower()]

    def get_template_by_type(self, acc_type: str) -> List[Dict[str, Any]]:
        """Get accounts filtered by type (H or D)."""
        accounts = self.get_template_accounts()
        normalized_type = 'H' if acc_type.upper() in ['H', 'HEADER'] else 'D'
        return [acc for acc in accounts if acc.get('type') == normalized_type]

    def get_template_account(self, code: str) -> Optional[Dict[str, Any]]:
        """Get a specific account from template by code."""
        accounts = self.get_template_accounts()
        for acc in accounts:
            if acc['code'] == code:
                return acc
        return None

    def search_template(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        acc_type: Optional[str] = None,
        tag: Optional[str] = None,
        vendor: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Search template accounts with various filters."""
        accounts = self.get_template_accounts()
        
        if search:
            search_lower = search.lower()
            accounts = [
                acc for acc in accounts
                if search_lower in acc.get('code', '').lower()
                or search_lower in acc.get('description', '').lower()
                or search_lower in acc.get('long_description', '').lower()
            ]
        
        if category:
            accounts = [
                acc for acc in accounts
                if acc.get('category', '').lower() == category.lower()
            ]
        
        if acc_type:
            normalized_type = 'H' if acc_type.upper() in ['H', 'HEADER'] else 'D'
            accounts = [
                acc for acc in accounts
                if acc.get('type') == normalized_type
            ]
        
        if tag:
            tag_lower = tag.lower()
            accounts = [
                acc for acc in accounts
                if any(tag_lower in t.lower() for t in acc.get('tags', []))
            ]
        
        if vendor:
            vendor_lower = vendor.lower()
            accounts = [
                acc for acc in accounts
                if any(vendor_lower in v.lower() for v in acc.get('default_vendors', []))
            ]
        
        return accounts

    def get_template_stats(self) -> Dict[str, Any]:
        """Get statistics about the template."""
        accounts = self.get_template_accounts()
        
        categories = {}
        types = {'H': 0, 'D': 0}
        tags = set()
        vendors = set()
        
        for acc in accounts:
            cat = acc.get('category', 'Unknown')
            categories[cat] = categories.get(cat, 0) + 1
            
            acc_type = acc.get('type', 'D')
            types[acc_type] = types.get(acc_type, 0) + 1
            
            for tag in acc.get('tags', []):
                tags.add(tag)
            
            for vendor in acc.get('default_vendors', []):
                vendors.add(vendor)
        
        return {
            'total_accounts': len(accounts),
            'header_count': types.get('H', 0),
            'detail_count': types.get('D', 0),
            'categories': categories,
            'unique_tags': len(tags),
            'unique_vendors': len(vendors),
            'top_tags': list(tags)[:20],
        }

    def get_categories(self) -> List[str]:
        """Get all unique categories from template."""
        accounts = self.get_template_accounts()
        categories = set()
        for acc in accounts:
            cat = acc.get('category', '')
            if cat:
                categories.add(cat)
        return sorted(list(categories))

    def get_subcategories(self) -> List[str]:
        """Get all unique subcategories from template."""
        accounts = self.get_template_accounts()
        subcategories = set()
        for acc in accounts:
            subcat = acc.get('subcategory', '')
            if subcat:
                subcategories.add(subcat)
        return sorted(list(subcategories))

    def get_all_tags(self) -> List[str]:
        """Get all unique tags from template."""
        accounts = self.get_template_accounts()
        tags = set()
        for acc in accounts:
            for tag in acc.get('tags', []):
                tags.add(tag)
        return sorted(list(tags))

    def get_fs_mappings(self) -> List[str]:
        """Get all unique FS mappings."""
        accounts = self.get_template_accounts()
        mappings = set()
        for acc in accounts:
            mapping = acc.get('fs_mapping', '')
            if mapping:
                mappings.add(mapping)
        return sorted(list(mappings))


# Create singleton instance at module load for fast access
_template_service = None

def get_template_service() -> MasterTemplateService:
    """Get the singleton template service instance."""
    global _template_service
    if _template_service is None:
        _template_service = MasterTemplateService()
    return _template_service

