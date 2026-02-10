import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Determine which .env file to load
app_env = os.getenv("APP_ENV", "development")
env_file = ".env.dev" if app_env == "development" else ".env"

class Settings(BaseSettings):
    """
    Manages application-wide settings, loading from environment variables and .env files.
    Provides safe fallbacks for all integration-related settings, allowing the
    backend to boot and operate in a "manual" or "local-only" mode.
    """
    # --- Core Application Settings ---
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev_key"
    ALLOW_MANUAL_DATA_FALLBACK: bool = True

    # --- Database Settings ---
    DATABASE_URL: str = "postgresql+psycopg2://user:password@localhost:5432/chartforge_dev"
    DATABASE_SSLMODE: Optional[str] = None

    # --- Supabase Settings ---
    SUPABASE_URL: Optional[str] = None
    SUPABASE_JWT_AUD: Optional[str] = "authenticated"
    SUPABASE_JWT_ISSUER: Optional[str] = None
    
    # --- Superuser Settings ---
    FIRST_SUPERUSER: str = "admin@chartforge.com"
    FIRST_SUPERUSER_PASSWORD: str = "ChangeMe!123"

    # --- QuickBooks Online (QBO) Integration (Optional) ---
    QBO_CLIENT_ID: Optional[str] = None
    QBO_CLIENT_SECRET: Optional[str] = None
    QBO_REDIRECT_URI: Optional[str] = None
    QBO_ENVIRONMENT: str = "sandbox"

    # --- Organizer AI (Ollama) Settings (Optional) ---
    OLLAMA_HOST: Optional[str] = None
    OLLAMA_BASE_URL: Optional[str] = None
    OLLAMA_MODEL: Optional[str] = None
    ORGANIZER_MODEL_NAME: Optional[str] = None
    ORGANIZER_MAX_FEWSHOT: int = 10

    # --- Cloudflare AI Settings ---
    AI_PROVIDER: str = "ollama" # "ollama" or "cloudflare"
    CLOUDFLARE_ACCOUNT_ID: Optional[str] = None
    CLOUDFLARE_API_TOKEN: Optional[str] = None

    # --- Code Generator Settings ---
    CODE_PATTERN: str = "X.XX.XX.XX"
    CODE_SEGMENT_PAD: str = "0"
    CODE_SEPARATOR: str = "."
    CODE_MAX_LEVEL: int = 5
    
    # Pydantic-Settings configuration
    model_config = SettingsConfigDict(
        env_file=env_file,
        env_file_encoding='utf-8',
        extra="ignore"  # Ignore unknown environment variables
    )

    @property
    def QBO_INTEGRATION_ENABLED(self) -> bool:
        """Returns True if QBO is fully configured."""
        return all([self.QBO_CLIENT_ID, self.QBO_CLIENT_SECRET, self.QBO_REDIRECT_URI])

    @property
    def OLLAMA_INTEGRATION_ENABLED(self) -> bool:
        """Returns True if the Organizer AI (Ollama) is fully configured."""
        return all([self.OLLAMA_HOST, self.OLLAMA_MODEL])

    @property
    def SUPABASE_JWKS_URL(self) -> Optional[str]:
        """Returns the Supabase JWKS URL if SUPABASE_URL is configured."""
        if not self.SUPABASE_URL:
            return None
        return f"{self.SUPABASE_URL.rstrip('/')}/auth/v1/keys"

    @property
    def SUPABASE_ISSUER(self) -> Optional[str]:
        """Returns the JWT issuer to validate against."""
        if self.SUPABASE_JWT_ISSUER:
            return self.SUPABASE_JWT_ISSUER
        if not self.SUPABASE_URL:
            return None
        return f"{self.SUPABASE_URL.rstrip('/')}/auth/v1"

# Instantiate the settings object
settings = Settings()
