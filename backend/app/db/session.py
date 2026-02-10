from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi import Request

from app.core.config import settings
from app.core.supabase_auth import claims_to_json

connect_args = {}
if settings.DATABASE_SSLMODE:
    connect_args["sslmode"] = settings.DATABASE_SSLMODE

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def _apply_rls_context(db, claims: dict | None):
    if claims:
        db.execute(
            text("select set_config('request.jwt.claims', :claims, true)"),
            {"claims": claims_to_json(claims)}
        )
        db.execute(text("select set_config('role', :role, true)"), {"role": "authenticated"})
    else:
        db.execute(text("select set_config('role', :role, true)"), {"role": "anon"})


def get_db(request: Request):
    db = SessionLocal()
    try:
        claims = getattr(request.state, "jwt_claims", None)
        _apply_rls_context(db, claims)
        yield db
    finally:
        db.close()
