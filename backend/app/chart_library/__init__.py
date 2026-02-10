
import uuid
from typing import List, Dict, Any, Optional
from .master_usgaap_v1 import MASTER_CHART_DATA
from .categories import CATEGORIES

# Cache for the processed template
_TEMPLATE_CACHE: List[Dict[str, Any]] = []
_TREE_CACHE: List[Dict[str, Any]] = []

def _generate_uuid(code: str) -> uuid.UUID:
    """Generate a deterministic UUID based on the account code."""
    # Use a custom namespace for ChartForge accounts
    NAMESPACE_CHARTFORGE = uuid.uuid5(uuid.NAMESPACE_DNS, "chartforge.io")
    return uuid.uuid5(NAMESPACE_CHARTFORGE, code)

def _calculate_level(code: str, parent_code: Optional[str]) -> int:
    """
    Calculate level based on hierarchy. 
    This is a simplified version. Ideally we'd use the CodePattern service,
    but we want this library to be standalone.
    For now, we can infer it from the tree build or just assume standard depth.
    Actually, let's just use a simple heuristic or calculate it during tree build.
    """
    # Placeholder: Level will be set during tree build or initialization
    return 1

def load_template() -> List[Dict[str, Any]]:
    """
    Loads and processes the master chart template.
    Enriches data with UUIDs and Levels.
    """
    global _TEMPLATE_CACHE
    if _TEMPLATE_CACHE:
        return _TEMPLATE_CACHE

    processed_data = []
    code_map = {}

    # First pass: Generate UUIDs and basic cleanup
    for acc in MASTER_CHART_DATA:
        # Create a copy to avoid mutating the original constant if we reload
        item = acc.copy()
        item["id"] = _generate_uuid(item["code"])
        item["version"] = 1
        item["company_accounts"] = []
        
        # Normalize type
        acc_type = item.get("type", "Detail")
        if acc_type and acc_type.upper() in ["HEADER", "H"]:
            item["type"] = "H"
        else:
            item["type"] = "D"

        # Ensure required fields for Schema
        if "tags" not in item or item["tags"] is None:
            item["tags"] = []
        if "default_vendors" not in item or item["default_vendors"] is None:
            item["default_vendors"] = []
            
        processed_data.append(item)
        code_map[item["code"]] = item

    # Second pass: Calculate levels and parent_ids
    for item in processed_data:
        parent_code = item.get("parent_code")
        if parent_code and parent_code in code_map:
            parent = code_map[parent_code]
            item["parent_id"] = parent["id"]
            # We'll calculate level properly in a tree traversal or just simple +1
            # But since we don't have the full tree yet, let's do a quick lookup
            # This assumes parents appear before children or we resolve recursively.
            # For safety, let's just set level=0 and fix it in build_tree.
        else:
            item["parent_id"] = None
            item["level"] = 1

    # Calculate levels recursively
    def get_level(code, current_depth=0):
        if current_depth > 10: return 1 # Loop protection
        item = code_map.get(code)
        if not item: return 1
        if not item.get("parent_code"): return 1
        return get_level(item["parent_code"], current_depth + 1) + 1

    for item in processed_data:
        item["level"] = get_level(item["code"])

    _TEMPLATE_CACHE = processed_data
    return _TEMPLATE_CACHE

def get_template() -> List[Dict[str, Any]]:
    """Returns the flat list of template accounts."""
    return load_template()

def get_categories() -> List[str]:
    """Returns the list of unique categories."""
    return CATEGORIES

def get_account_by_code(code: str) -> Optional[Dict[str, Any]]:
    """Finds an account by its code."""
    template = load_template()
    for account in template:
        if account["code"] == code:
            return account
    return None

def build_tree() -> List[Dict[str, Any]]:
    """
    Builds a hierarchical tree structure from the template.
    Returns a list of root nodes with 'children' populated.
    """
    global _TREE_CACHE
    if _TREE_CACHE:
        return _TREE_CACHE

    accounts = load_template()
    
    # Deep copy to avoid modifying the cached flat list when adding 'children'
    # Actually, we want 'children' in the tree output, but maybe not in the flat list?
    # The Schema for Tree has 'children'. The Schema for Flat doesn't (or ignores it).
    # Let's create a map of dicts for the tree.
    
    import copy
    # We only copy the structure we need
    nodes = {acc["code"]: acc.copy() for acc in accounts}
    for node in nodes.values():
        node["children"] = []

    roots = []
    
    for code, node in nodes.items():
        parent_code = node.get("parent_code")
        if parent_code and parent_code in nodes:
            nodes[parent_code]["children"].append(node)
        else:
            roots.append(node)

    # Sort children
    def sort_tree(node_list):
        node_list.sort(key=lambda x: x["code"])
        for node in node_list:
            if node["children"]:
                sort_tree(node["children"])

    sort_tree(roots)
    _TREE_CACHE = roots
    return _TREE_CACHE
