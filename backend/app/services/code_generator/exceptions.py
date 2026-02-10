class CodeGenerationException(Exception):
    """Base exception for the code generator module."""
    def __init__(self, message="An error occurred during code generation."):
        self.message = message
        super().__init__(self.message)

class InvalidPatternException(CodeGenerationException):
    """Raised when the code pattern string is invalid."""
    def __init__(self, message="The provided code pattern is invalid."):
        super().__init__(message)

class CodeConflictException(CodeGenerationException):
    """Raised when a generated code conflicts with an existing one."""
    def __init__(self, code: str, message: str = "Generated code conflicts with an existing entry."):
        self.code = code
        super().__init__(f"Code '{code}' conflict: {message}")

class ParentNotFoundException(CodeGenerationException):
    """Raised when the specified parent code does not exist."""
    def __init__(self, parent_code: str):
        self.parent_code = parent_code
        super().__init__(f"Parent code '{parent_code}' not found in the Master Chart.")

class MaxDepthExceededException(CodeGenerationException):
    """Raised when trying to generate a code beyond the maximum allowed depth."""
    def __init__(self, max_depth: int):
        self.max_depth = max_depth
        super().__init__(f"Cannot generate code beyond the maximum depth of {max_depth}.")

class ValidationException(CodeGenerationException):
    """Raised when a code fails validation."""
    def __init__(self, issues: list):
        self.issues = issues
        super().__init__(f"Code validation failed with issues: {', '.join(issues)}")
