import re
from functools import lru_cache
from app.core.config import settings
from app.services.code_generator.exceptions import InvalidPatternException

class CodePattern:
    """
    Parses and manages a hierarchical code pattern like 'X.XX.XX' or '1.1.1.1'.
    """
    def __init__(self, pattern: str, separator: str | None = None):
        if not pattern or not isinstance(pattern, str):
            raise InvalidPatternException("Pattern must be a non-empty string.")
            
        self.pattern = pattern
        
        # Determine separator
        if separator is not None:
            self.separator = separator
        else:
            # Auto-detect separator
            non_alphanumeric = re.findall(r'[^a-zA-Z0-9]', pattern)
            if non_alphanumeric:
                if len(set(non_alphanumeric)) > 1:
                    raise InvalidPatternException("Pattern contains multiple different separators.")
                self.separator = non_alphanumeric[0]
            else:
                self.separator = ''

        # Parse segments
        if self.separator:
            self.segments = self.pattern.split(self.separator)
        else:
            # Handle patterns without separators, e.g., "XXXX" or "XX-XX" if separator is passed as ""
            # This part can be tricky. For now, assume no separator means one segment.
            self.segments = [self.pattern]

        self.segment_lengths = [len(s) for s in self.segments]
        self.segment_count = len(self.segments)
        self.max_depth = self.segment_count

    def get_level_from_code(self, code: str) -> int:
        """Determines the hierarchical level of a given code based on the pattern."""
        return len(self.split_code(code))

    def get_segment_length(self, level: int) -> int:
        """Returns the length of the segment at a given level (1-based)."""
        if 1 <= level <= self.segment_count:
            return self.segment_lengths[level - 1]
        raise IndexError(f"Level {level} is out of bounds for this pattern.")

    def apply_padding(self, segment_value: int, level: int) -> str:
        """Applies left zero-padding to a segment value based on the pattern."""
        target_length = self.get_segment_length(level)
        return str(segment_value).zfill(target_length)

    def split_code(self, code: str) -> list[str]:
        """Splits a code string into its segments."""
        if self.separator:
            return code.split(self.separator)
        # For no-separator patterns, we need to split based on segment lengths
        parts = []
        current_pos = 0
        for length in self.segment_lengths:
            part = code[current_pos:current_pos + length]
            if not part:
                break
            parts.append(part)
            current_pos += length
        return parts


    def join_code(self, segments: list[str]) -> str:
        """Joins a list of segments into a single code string."""
        return self.separator.join(segments)

    def validate_code_against_pattern(self, code: str) -> bool:
        """Checks if a code's structure matches the pattern."""
        parts = self.split_code(code)
        if len(parts) > self.segment_count:
            return False
        
        for i, part in enumerate(parts):
            if len(part) != self.segment_lengths[i]:
                return False
            if not part.isdigit():
                return False
        return True

    def get_parent_code(self, code: str) -> str | None:
        """Returns the parent code of a given code."""
        segments = self.split_code(code)
        if len(segments) <= 1:
            return None
        return self.join_code(segments[:-1])


@lru_cache()
def get_active_pattern() -> CodePattern:
    """
    Initializes and returns the active CodePattern from the application settings.
    Uses lru_cache to ensure it's only created once.
    """
    return CodePattern(pattern=settings.CODE_PATTERN, separator=settings.CODE_SEPARATOR)
