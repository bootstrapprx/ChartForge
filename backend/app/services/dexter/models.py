from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum


class ChatRequest(BaseModel):
    message: str
    ucid: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    sources: Optional[List[str]] = None
    suggested_actions: Optional[List[str]] = None
    charts: Optional[List[Dict[str, Any]]] = None  # For embedded chart data


class IngestRequest(BaseModel):
    ucid: str
    data_type: str  # "master_chart", "ledger", "mappings", "rebuild"
    content: Optional[Dict[str, Any]] = None


class SuggestionRequest(BaseModel):
    ucid: str
    description: str
    amount: Optional[float] = None
    vendor: Optional[str] = None


class AccountSuggestion(BaseModel):
    account_code: str
    account_name: str
    confidence: float
    reasoning: str


# --- New Models for Enhanced Dexter ---

class ExplainAccountRequest(BaseModel):
    code: str
    detail_level: str = "short"  # "short", "detailed", "comprehensive"
    include_compliance: bool = False


class AccountExplanation(BaseModel):
    code: str
    description: str
    long_description: Optional[str] = None
    category: str
    type: str
    normal_balance: str
    fs_mapping: Optional[str] = None
    purpose: str
    when_to_use: List[str]
    when_not_to_use: List[str]
    related_accounts: List[Dict[str, str]]
    compliance_info: Optional[Dict[str, Any]] = None
    gaap_rationale: Optional[str] = None


class ReportType(str, Enum):
    EXPENSE_BREAKDOWN = "expense_breakdown"
    VENDOR_CONCENTRATION = "vendor_concentration"
    REVENUE_FLOW = "revenue_flow"
    ASSET_LIABILITY_DELTA = "asset_liability_delta"
    CATEGORY_SUMMARY = "category_summary"
    HIERARCHY_ANALYSIS = "hierarchy_analysis"


class ReportRequest(BaseModel):
    report_type: ReportType
    ucid: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class ReportResponse(BaseModel):
    report_type: str
    title: str
    summary: str
    data: Dict[str, Any]
    charts: List[Dict[str, Any]]
    generated_at: str
    recommendations: Optional[List[str]] = None


class InsightType(str, Enum):
    ANOMALIES = "anomalies"
    MISSING_MAPPINGS = "missing_mappings"
    DUPLICATE_ACCOUNTS = "duplicate_accounts"
    INCONSISTENT_HIERARCHIES = "inconsistent_hierarchies"
    UNUSED_ACCOUNTS = "unused_accounts"
    ALL = "all"


class InsightRequest(BaseModel):
    insight_type: InsightType = InsightType.ALL
    ucid: Optional[str] = None
    severity_threshold: str = "low"  # "low", "medium", "high"


class Insight(BaseModel):
    type: str
    severity: str  # "low", "medium", "high", "critical"
    title: str
    description: str
    affected_items: List[str]
    recommendation: str
    auto_fix_available: bool = False


class InsightsResponse(BaseModel):
    total_insights: int
    by_severity: Dict[str, int]
    insights: List[Insight]
    generated_at: str


class CategoryPredictionRequest(BaseModel):
    transaction_description: str
    vendor: Optional[str] = None
    amount: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class CategoryPrediction(BaseModel):
    primary_suggestion: AccountSuggestion
    alternatives: List[AccountSuggestion]
    transaction_type: str  # "expense", "revenue", "asset", etc.
    confidence_explanation: str
