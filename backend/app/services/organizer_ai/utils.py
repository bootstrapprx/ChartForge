import re

def clean_text(text: str) -> str:
    """
    Normalizes and cleans text by removing extra whitespace and converting to lowercase.
    """
    if not isinstance(text, str):
        return ""
    # Remove extra spaces and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    # Convert to lowercase
    text = text.lower()
    return text
