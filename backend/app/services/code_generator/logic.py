from typing import List, Dict, Any, Optional

from .patterns import CodePattern
from .exceptions import *
from app.schemas.master_account import MasterAccountSchema # Using schema, not model

def get_next_child_code(
    parent_code: str,
    parent_type: str,
    parent_level: int,
    children_codes: List[str],
    pattern: CodePattern
) -> str:
    """
    Generates the next available hierarchical code for a given parent.
    This is a pure function with no database access.
    """
    if parent_type == 'D':
        raise CodeGenerationException(f"Parent account '{parent_code}' is a Detail account and cannot have children.")

    child_level = parent_level + 1
    if child_level > pattern.max_depth:
        raise MaxDepthExceededException(pattern.max_depth)

    if not children_codes:
        next_segment_val = 1
    else:
        highest_segment = 0
        for code in children_codes:
            child_segments = pattern.split_code(code)
            try:
                # Get the segment corresponding to the child's level
                last_segment = int(child_segments[parent_level])
                if last_segment > highest_segment:
                    highest_segment = last_segment
            except (IndexError, ValueError):
                continue
        next_segment_val = highest_segment + 1
        
    next_segment_str = pattern.apply_padding(next_segment_val, child_level)
    
    parent_segments = pattern.split_code(parent_code)
    new_code_segments = parent_segments + [next_segment_str]
    
    return pattern.join_code(new_code_segments)

def get_next_root_code(
    root_codes: List[str],
    pattern: CodePattern
) -> str:
    """
    Generates the next available top-level (root) code.
    Pure function with no database access.
    """
    if not root_codes:
        next_segment_val = 1
    else:
        highest_root = 0
        for code in root_codes:
            try:
                root_val = int(pattern.split_code(code)[0])
                if root_val > highest_root:
                    highest_root = root_val
            except (IndexError, ValueError):
                continue
        next_segment_val = highest_root + 1

    next_segment_str = pattern.apply_padding(next_segment_val, level=1)
    return next_segment_str
