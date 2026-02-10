from typing import List, Dict, Any, Optional

from .patterns import CodePattern

def validate_code_structure(
    code: str,
    parent_code: Optional[str],
    parent_exists: bool,
    parent_type: Optional[str],
    pattern: CodePattern
) -> List[str]:
    """
    Validates the internal structure of a code against the active pattern.
    Pure function with no database access.
    """
    issues = []
    
    if not pattern.validate_code_against_pattern(code):
        issues.append(f"Code does not match the pattern '{pattern.pattern}'.")
        return issues

    if pattern.separator:
        if code.startswith(pattern.separator) or code.endswith(pattern.separator):
            issues.append("Code has leading or trailing separators.")

    # Check for hierarchy "holes"
    derived_parent_code = pattern.get_parent_code(code)
    if derived_parent_code != parent_code:
         issues.append(f"Provided parent code '{parent_code}' does not match derived parent '{derived_parent_code}'.")

    if derived_parent_code:
        if not parent_exists:
            issues.append(f"Parent code '{derived_parent_code}' does not exist in the Master Chart.")
        elif parent_type == 'D':
             issues.append(f"Parent account '{derived_parent_code}' is a Detail account and cannot have children.")

    return issues

def detect_code_conflicts(
    code: str,
    code_exists: bool,
    parent_code: Optional[str],
    parent_exists: bool,
    parent_type: Optional[str],
    pattern: CodePattern
) -> Dict[str, Any]:
    """
    Checks for conflicts with a given code.
    Pure function with no database access.
    """
    response = {
        "code": code,
        "is_valid": True,
        "issues": []
    }

    structure_issues = validate_code_structure(code, parent_code, parent_exists, parent_type, pattern)
    if structure_issues:
        response["is_valid"] = False
        response["issues"].extend(structure_issues)
        return response

    if code_exists:
        response["is_valid"] = False
        response["issues"].append("Code already exists.")

    return response
