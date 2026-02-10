import pytest
from app.core.ucid import generate_ucid

def test_generate_ucid_basic():
    # Basic test
    assert len(generate_ucid("Acme")) == 4

def test_generate_ucid_normalization():
    # Test normalization rules
    # 1. Uppercase
    assert generate_ucid("acme") == generate_ucid("ACME")
    
    # 2. Remove suffixes
    # "Acme Inc" -> "ACME"
    # "Acme LLC" -> "ACME"
    assert generate_ucid("Acme Inc") == generate_ucid("Acme")
    assert generate_ucid("Acme LLC") == generate_ucid("Acme")
    assert generate_ucid("Acme Corporation") == generate_ucid("Acme")
    
    # 3. Remove non-alphanumeric
    # "Acme-Corp" -> "ACME" (after suffix removal if Corp is suffix, or just non-alnum)
    # "Acme & Sons" -> "ACMESONS"
    assert generate_ucid("Acme & Sons") == generate_ucid("Acme Sons")

def test_generate_ucid_hashing():
    # Test consistency
    assert generate_ucid("Test Company") == generate_ucid("Test Company")
    
    # Test different inputs produce different outputs (mostly)
    assert generate_ucid("Company A") != generate_ucid("Company B")

def test_generate_ucid_empty():
    with pytest.raises(ValueError):
        generate_ucid("")
