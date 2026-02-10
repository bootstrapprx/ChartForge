from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    companies,
    masterchart,
    companychart,
    mapping,
    upload,
    snapshots,
    templates,
    merge,
    qbo,
    settings,
    auth,
    users,
    permissions,
    admin,
    master_template,
)
from app.services.organizer_ai.router import router as organizer_router
from app.services.code_generator import router as code_generator_router
from app.services.dexter.router import router as dexter_router
from app.api.v1.compat import router as compat_router
from app.core.supabase_auth import extract_bearer_token, verify_supabase_jwt, SupabaseAuthError

# Import all models to ensure they are registered with Base
from app.db.models import (
    master_account, 
    snapshot, 
    template, 
    company_account, 
    account_mapping,
    qbo_token, # New
    organizer_memory,
    organizer_rules,
    system_settings, # New
    user, # New
    user_company, # New
    coa_version, # COA Versioning
)

# Database schema is managed via Supabase CLI migrations.

app = FastAPI(
    title="ChartForge API",
    description="Backend for ChartForge application.",
    version="1.0.0",
)

@app.middleware("http")
async def supabase_auth_middleware(request, call_next):
    auth_header = request.headers.get("authorization")
    token = extract_bearer_token(auth_header)
    if token:
        try:
            claims = verify_supabase_jwt(token)
            request.state.jwt_claims = claims
            request.state.user_id = claims.get("sub")
            request.state.user_email = claims.get("email")
        except SupabaseAuthError:
            request.state.jwt_claims = None
    else:
        request.state.jwt_claims = None
    return await call_next(request)

@app.on_event("startup")
def startup_event():
    from app.db.session import SessionLocal
    from app.services.masterchart_service import MasterChartService
    
    db = SessionLocal()
    try:
        # Load Chart Library
        from app import chart_library
        chart_library.load_template()
        
        service = MasterChartService(db)
        # service.import_default_template_if_needed() # No longer needed as we serve from memory
    finally:
        db.close()

# CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add production origins from environment variable
import os
if os.getenv("BACKEND_CORS_ORIGINS"):
    origins.extend(os.getenv("BACKEND_CORS_ORIGINS").split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(dexter_router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(masterchart.router, prefix="/api/v1/masterchart", tags=["Master Chart"])
app.include_router(companychart.router, prefix="/api/v1", tags=["Company Chart"])
app.include_router(mapping.router, prefix="/api/v1", tags=["Mapping"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(snapshots.router, prefix="/api/v1", tags=["Snapshots"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["Templates"])
app.include_router(merge.router, prefix="/api/v1/merge", tags=["MergeEngine"])
app.include_router(qbo.router, prefix="/api/v1/qbo", tags=["QuickBooks"]) # New
app.include_router(organizer_router, prefix="/api/v1/organizer", tags=["OrganizerAI"])
app.include_router(code_generator_router, prefix="/api/v1/code", tags=["CodeGenerator"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["Settings"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(permissions.router, prefix="/api/v1/permissions", tags=["Permissions"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(master_template.router, prefix="/api/v1/master-template", tags=["Master Template"])
app.include_router(compat_router, prefix="/api/v1", tags=["Compatibility"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
