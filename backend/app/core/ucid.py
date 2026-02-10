import hashlib
import re

def generate_ucid(company_name: str) -> str:
    """
    Generates a Unique Company ID (UCID) based on the company name.
    
    Protocol:
    1. Normalization:
       - Uppercase
       - Remove suffixes
       - Remove all non-alphanumeric characters
    2. Hashing:
       - SHA-256
    3. Truncation:
       - First 4 hex chars
    """
    if not company_name:
        raise ValueError("Company name cannot be empty")

    # 1. Normalization
    normalized = company_name.upper()
    
    # List of suffixes to remove (order matters: longer matches first to avoid partial removals)
    suffixes = [
        "INCORPORATED", "CORPORATION", "PARTNERSHIP", "LIMITED", "COMPANY", "PARTNERS", 
        "GROUP", "LLLP", "GMBH", "CORP", "INC", "LLC", "LTD", "LLP", "PLC", "S.A.", "SA", "AG", "CO"
    ]
    
    # Create a regex pattern to match suffixes at the end of the string, preceded by a word boundary or space
    # We use \b for word boundary, but also handle cases where it might be just space separated
    # The regex will look like: \b(SUFFIX1|SUFFIX2|...)\b$
    # We need to be careful with dots in suffixes like S.A.
    
    # Escape dots in suffixes for regex
    escaped_suffixes = [re.escape(s) for s in suffixes]
    pattern = r'\b(' + '|'.join(escaped_suffixes) + r')\.?$'
    
    # Remove suffix
    # We might need to run this in a loop or just once? Usually one suffix.
    # But "Acme Corp Inc" might exist. The spec says "remove suffixes", plural.
    # Let's try to remove them iteratively until no match.
    
    while True:
        # Strip whitespace before checking
        normalized = normalized.strip()
        match = re.search(pattern, normalized)
        if match:
            # Remove the match
            normalized = normalized[:match.start()]
        else:
            break
            
    # Remove all non-alphanumeric characters
    normalized = re.sub(r'[^A-Z0-9]', '', normalized)
    
    # 2. Hashing
    hash_object = hashlib.sha256(normalized.encode('utf-8'))
    hex_dig = hash_object.hexdigest()
    
    # 3. Truncation
    ucid = hex_dig[:4].upper()
    
    return ucid
