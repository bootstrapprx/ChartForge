from fastapi.testclient import TestClient
import pytest

def test_app_boot():
    """
    Tests that the FastAPI application boots up without errors.
    It does this by attempting to import the main 'app' object
    and initializing a TestClient.
    """
    try:
        from app.main import app
        client = TestClient(app)
        # Perform a basic request to ensure the app is responsive
        response = client.get("/api/v1/companies") # a sample endpoint
        # Check for a successful status code (e.g., 200 or 404, just not 500)
        assert response.status_code != 500
    except Exception as e:
        pytest.fail(f"Application failed to boot: {e}")