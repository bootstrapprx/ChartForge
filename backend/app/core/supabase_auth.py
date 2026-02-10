import json
import time
from typing import Any, Dict, Optional

import httpx
from jose import jwt, jwk

from app.core.config import settings

_JWKS_CACHE: Dict[str, Any] = {"keys": None, "fetched_at": 0}
_JWKS_TTL_SECONDS = 60 * 10  # 10 minutes


class SupabaseAuthError(Exception):
    pass


def _fetch_jwks() -> Dict[str, Any]:
    if not settings.SUPABASE_JWKS_URL:
        raise SupabaseAuthError("SUPABASE_URL is not configured; cannot fetch JWKS.")

    response = httpx.get(settings.SUPABASE_JWKS_URL, timeout=10.0)
    response.raise_for_status()
    return response.json()


def get_jwks() -> Dict[str, Any]:
    now = time.time()
    if _JWKS_CACHE["keys"] and (now - _JWKS_CACHE["fetched_at"] < _JWKS_TTL_SECONDS):
        return _JWKS_CACHE["keys"]

    jwks = _fetch_jwks()
    _JWKS_CACHE["keys"] = jwks
    _JWKS_CACHE["fetched_at"] = now
    return jwks


def _get_signing_key(token: str) -> Any:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise SupabaseAuthError("Missing 'kid' in token header.")

    jwks = get_jwks()
    keys = jwks.get("keys", [])
    for key in keys:
        if key.get("kid") == kid:
            return jwk.construct(key)

    raise SupabaseAuthError("No matching JWK for token.")


def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verify a Supabase JWT and return decoded claims.
    """
    signing_key = _get_signing_key(token)
    public_key = signing_key.to_pem().decode("utf-8")

    options = {
        "verify_aud": settings.SUPABASE_JWT_AUD is not None,
        "verify_iss": settings.SUPABASE_ISSUER is not None,
    }

    claims = jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        audience=settings.SUPABASE_JWT_AUD,
        issuer=settings.SUPABASE_ISSUER,
        options=options,
    )

    if not claims.get("sub"):
        raise SupabaseAuthError("Token missing subject (sub).")

    return claims


def extract_bearer_token(auth_header: Optional[str]) -> Optional[str]:
    if not auth_header:
        return None
    if not auth_header.lower().startswith("bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def claims_to_json(claims: Dict[str, Any]) -> str:
    return json.dumps(claims, separators=(",", ":"))
