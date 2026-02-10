import httpx
import json
from typing import Optional

from app.core.config import settings

class OllamaModel:
    def __init__(self, model_name: str = settings.ORGANIZER_MODEL_NAME):
        self.model_name = model_name
        self.base_url = settings.OLLAMA_BASE_URL
        self.generate_url = f"{self.base_url}/api/generate"

    async def infer(self, prompt: str) -> Optional[str]:
        """
        Sends a prompt to the Ollama API and returns the model's response.
        """
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.generate_url, json=payload)
                response.raise_for_status()
                
                response_json = response.json()
                
                # The actual JSON content from the model is often in the 'response' field as a string.
                # We need to parse this string to get the final JSON object.
                model_response_str = response_json.get("response")
                if model_response_str:
                    return model_response_str
                return None

            except httpx.RequestError as e:
                print(f"Error connecting to Ollama: {e}")
                return None
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from model response: {e}")
                return None

    async def is_available(self) -> bool:
        """
        Checks if the Ollama model is available and loaded.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.base_url)
                return response.status_code == 200
        except httpx.RequestError:
            return False

# ... (existing imports)
from app.services.organizer_ai.cloudflare_client import CloudflareModel
from app.db.session import SessionLocal
from app.db.models.system_settings import SystemSettings
from sqlalchemy.exc import OperationalError, SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

# ... (OllamaModel class definition)

def get_setting(key: str, default: str = None) -> str:
    """
    Retrieves a setting from the database, falling back to environment variables
    if the database is unavailable. This allows the app to start even if the
    database connection fails.
    """
    db = SessionLocal()
    try:
        setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
        return setting.value if setting else default
    except (OperationalError, SQLAlchemyError) as e:
        logger.warning(
            f"Database connection failed when retrieving setting '{key}': {e}. "
            f"Falling back to environment variable default."
        )
        return default
    except Exception as e:
        logger.error(f"Unexpected error retrieving setting '{key}': {e}")
        return default
    finally:
        db.close()

def get_model():
    """
    Creates and returns the appropriate AI model based on configuration.
    Prioritizes database settings, falls back to environment variables.
    """
    # Prioritize DB settings, fallback to env vars
    ai_provider = get_setting("AI_PROVIDER", settings.AI_PROVIDER)
    
    if ai_provider == "cloudflare":
        account_id = get_setting("CLOUDFLARE_ACCOUNT_ID", settings.CLOUDFLARE_ACCOUNT_ID)
        api_token = get_setting("CLOUDFLARE_API_TOKEN", settings.CLOUDFLARE_API_TOKEN)
        model_name = get_setting("ORGANIZER_MODEL_NAME", settings.ORGANIZER_MODEL_NAME or "@cf/meta/llama-3-8b-instruct")
        
        return CloudflareModel(
            account_id=account_id,
            api_token=api_token,
            model_name=model_name
        )
    return OllamaModel()

# Lazy initialization - model is created on first access
_organizer_model = None

def get_organizer_model():
    """
    Returns the organizer model instance, initializing it lazily on first call.
    This prevents database queries at module import time, allowing the app
    to start even if the database is temporarily unavailable.
    """
    global _organizer_model
    if _organizer_model is None:
        _organizer_model = get_model()
    return _organizer_model

# Proxy class for lazy initialization with backward compatibility
class _ModelProxy:
    """
    Proxy object that lazily initializes the model on attribute access.
    This allows the module-level `ollama_model` and `organizer_model` variables
    to work as before, but without triggering database queries at import time.
    """
    def __getattr__(self, name):
        return getattr(get_organizer_model(), name)
    
    def __call__(self, *args, **kwargs):
        # Handle case where someone tries to call the proxy directly
        return get_organizer_model()(*args, **kwargs)

# Module-level instances for backward compatibility
# These will lazily initialize the model on first use
organizer_model = _ModelProxy()
ollama_model = organizer_model  # Deprecated alias for backward compatibility


