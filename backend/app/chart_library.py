"""
Chart Library Module
In-memory cache for the default Master Chart Template.
Loaded at startup from the standard_chart.csv file.
"""

import csv
import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Global in-memory storage
_template_data: Optional[List[Dict[str, Any]]] = None
_template_tree: Optional[List[Dict[str, Any]]] = None


def _get_template_path() -> Path:
    """Get path to the standard chart CSV file."""
    repo_root = Path(__file__).resolve().parents[2]
    possible_paths = [
        repo_root / "assets" / "standard_chart.csv",
        Path(os.getcwd()) / "assets" / "standard_chart.csv",
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    raise FileNotFoundError(f"standard_chart.csv not found. Tried: {possible_paths}")


def _parse_list(value: str) -> List[str]:
    """Parse comma-separated string to list."""
    if not value or value.strip() == '':
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


def _normalize_type(value: str) -> str:
    """Normalize type to H or D."""
    if not value:
        return 'D'
    value = value.strip().upper()
    if value in ['H', 'HEADER']:
        return 'H'
    return 'D'


def _parse_csv_row(row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Parse a CSV row into normalized account data."""
    code = str(row.get('code', '')).strip()
    if not code:
        return None

    description = str(row.get('description', '')).strip()
    if not description:
        return None

    tags = _parse_list(row.get('tags', ''))
    default_vendors = _parse_list(row.get('default_vendors', ''))

    return {
        'code': code,
        'description': description,
        'long_description': row.get('long_description', ''),
        'type': _normalize_type(row.get('type', '')),
        'category': row.get('category', ''),
        'fs_mapping': row.get('fs_mapping', ''),
        'parent_code': row.get('parent_code', ''),
        'normal_balance': row.get('normal_balance', ''),
        'tags': tags,
        'default_vendors': default_vendors,
        'regulatory_mapping': row.get('regulatory_mapping', ''),
        'start_date': row.get('start_date', ''),
        'end_date': row.get('end_date', ''),
        'notes': row.get('notes', ''),
        'subcategory': row.get('subcategory', ''),
        'cash_flow_classification': row.get('cash_flow_classification', ''),
        'cost_center': row.get('cost_center', ''),
        'gaap_classification': row.get('gaap_classification', '') or row.get('GAAP_classification', ''),
        'detailed_description': row.get('detailed_description', ''),
    }


def load_template() -> bool:
    """Load the template from CSV into memory. Called at startup."""
    global _template_data, _template_tree
    
    try:
        path = _get_template_path()
        logger.info(f"Loading chart template from: {path}")

        with open(path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            _template_data = []
            
            for row in reader:
                account = _parse_csv_row(row)
                if account:
                    _template_data.append(account)

        logger.info(f"Loaded {len(_template_data)} accounts into chart library")
        
        # Pre-build the tree
        _template_tree = _build_tree_from_data(_template_data)
        
        return True
    except Exception as e:
        logger.error(f"Failed to load chart template: {e}")
        _template_data = []
        _template_tree = []
        return False


def _build_tree_from_data(accounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build tree structure from flat account list."""
    account_map = {acc['code']: {**acc, 'children': []} for acc in accounts}
    
    roots = []
    for acc in accounts:
        code = acc['code']
        parent_code = acc.get('parent_code', '').strip()
        
        if parent_code and parent_code in account_map:
            account_map[parent_code]['children'].append(account_map[code])
        else:
            roots.append(account_map[code])
    
    return roots


def get_template() -> List[Dict[str, Any]]:
    """Get the loaded template data."""
    global _template_data
    if _template_data is None:
        load_template()
    return _template_data or []


def build_tree() -> List[Dict[str, Any]]:
    """Get the template as a tree structure."""
    global _template_tree
    if _template_tree is None:
        load_template()
    return _template_tree or []


def get_stats() -> Dict[str, Any]:
    """Get statistics about the template."""
    accounts = get_template()
    
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


def get_categories() -> List[str]:
    """Get all unique categories."""
    accounts = get_template()
    categories = set()
    for acc in accounts:
        cat = acc.get('category', '')
        if cat:
            categories.add(cat)
    return sorted(list(categories))


def get_tags() -> List[str]:
    """Get all unique tags."""
    accounts = get_template()
    tags = set()
    for acc in accounts:
        for tag in acc.get('tags', []):
            tags.add(tag)
    return sorted(list(tags))


def get_subcategories() -> List[str]:
    """Get all unique subcategories."""
    accounts = get_template()
    subcategories = set()
    for acc in accounts:
        subcat = acc.get('subcategory', '')
        if subcat:
            subcategories.add(subcat)
    return sorted(list(subcategories))


def get_account(code: str) -> Optional[Dict[str, Any]]:
    """Get a specific account by code."""
    accounts = get_template()
    for acc in accounts:
        if acc['code'] == code:
            return acc
    return None


def search(
    search_text: Optional[str] = None,
    category: Optional[str] = None,
    acc_type: Optional[str] = None,
    tag: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search template accounts with filters."""
    accounts = get_template()
    
    if search_text:
        search_lower = search_text.lower()
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
    
    return accounts
