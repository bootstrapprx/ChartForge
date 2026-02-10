from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from app.db.session import get_db
from sqlalchemy.orm import Session
from .models import (
    ChatRequest, ChatResponse, IngestRequest, SuggestionRequest, AccountSuggestion,
    ExplainAccountRequest, AccountExplanation, ReportRequest, ReportResponse, ReportType,
    InsightRequest, InsightsResponse, InsightType
)
from .engine import dexter_engine

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Interact with Dexter via chat.
    Dexter is your AI accounting assistant that can answer questions about
    accounts, suggest categories, explain accounting concepts, and more.
    """
    try:
        return await dexter_engine.chat(request, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest")
async def ingest_data(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Ingest data into Dexter's knowledge base (Passive Mode).
    Runs in background to process:
    - master_chart: Company accounts
    - mappings: Account mappings
    - rebuild: Full embedding rebuild
    """
    background_tasks.add_task(dexter_engine.ingest, request)
    return {"message": "Ingestion started", "data_type": request.data_type}


@router.post("/suggest-account", response_model=AccountSuggestion)
async def suggest_account(request: SuggestionRequest, db: Session = Depends(get_db)):
    """
    Get an account suggestion for a transaction based on description, vendor, etc.
    Returns the most likely account with confidence score and reasoning.
    """
    try:
        return await dexter_engine.suggest_account(request, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain-account/{code}", response_model=AccountExplanation)
async def explain_account(
    code: str,
    detail_level: str = Query("short", enum=["short", "detailed", "comprehensive"]),
    include_compliance: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Get a detailed explanation of a specific account.
    
    - **code**: The account code to explain
    - **detail_level**: short, detailed, or comprehensive
    - **include_compliance**: Include IFRS/GAAP compliance information
    """
    try:
        return await dexter_engine.explain_account(code, detail_level, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/report/{report_type}", response_model=ReportResponse)
async def generate_report(
    report_type: ReportType,
    ucid: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Generate financial reports.
    
    Available report types:
    - **expense_breakdown**: Breakdown of expense accounts
    - **vendor_concentration**: Analysis of vendor-related accounts
    - **revenue_flow**: Revenue account analysis
    - **asset_liability_delta**: Balance sheet structure
    - **category_summary**: Summary by category
    - **hierarchy_analysis**: COA hierarchy analysis
    """
    try:
        request = ReportRequest(report_type=report_type, ucid=ucid)
        return await dexter_engine.generate_report(request, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(
    insight_type: InsightType = Query(InsightType.ALL),
    ucid: Optional[str] = None,
    severity_threshold: str = Query("low", enum=["low", "medium", "high"]),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated insights about the Chart of Accounts.
    
    Insight types:
    - **anomalies**: Unusual patterns or missing data
    - **missing_mappings**: Accounts without proper mappings
    - **duplicate_accounts**: Potential duplicate accounts
    - **inconsistent_hierarchies**: Hierarchy issues (orphans, detail with children)
    - **unused_accounts**: Accounts that may not be needed
    - **all**: All insights combined
    """
    try:
        request = InsightRequest(
            insight_type=insight_type,
            ucid=ucid,
            severity_threshold=severity_threshold
        )
        return await dexter_engine.get_insights(request, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def dexter_health():
    """Check if Dexter AI service is healthy."""
    return {
        "status": "ok",
        "model": dexter_engine.model_name,
        "ollama_url": dexter_engine.ollama_base_url,
    }
