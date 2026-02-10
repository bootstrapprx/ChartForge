import logging
import json
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from .models import (
    ChatRequest, ChatResponse, IngestRequest, SuggestionRequest, AccountSuggestion,
    ExplainAccountRequest, AccountExplanation, ReportRequest, ReportResponse,
    InsightRequest, InsightsResponse, Insight, CategoryPredictionRequest, CategoryPrediction
)

logger = logging.getLogger(__name__)


class DexterEngine:
    def __init__(self):
        self.model_name = os.getenv("ORGANIZER_MODEL_NAME", "qwen2.5-coder:1.5b")
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

    async def chat(self, request: ChatRequest, db: Session) -> ChatResponse:
        """
        Active Mode: Process user chat message.
        """
        logger.info(f"Dexter Chat Request: {request.message} (UCID: {request.ucid})")
        
        from app.services.dexter.learning_engine import LearningEngine
        learning_engine = LearningEngine(db)
        
        # 1. Get embedding
        query_vector = await learning_engine.get_embedding(request.message)
        
        # 2. Search context
        context_docs = learning_engine.vector_store.search(request.ucid, query_vector, limit=5)
        context_text = "\n".join([f"- {doc.content}" for doc in context_docs])
        
        # 3. Construct prompt
        prompt = f"""You are Dexter, an expert AI accounting assistant for ChartForge.
Use the following context from the company's records to answer the user's question.
If the answer is not in the context, use your general accounting knowledge but mention that it's general advice.

Context:
{context_text}

User: {request.message}
Dexter:"""

        # 4. Call Ollama
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60.0
            )
            response.raise_for_status()
            reply = response.json()["response"]

        return ChatResponse(
            reply=reply,
            suggested_actions=[]
        )

    async def ingest(self, request: IngestRequest):
        """
        Passive Mode: Ingest data for learning.
        Creates its own DB session to run in background safely.
        """
        logger.info(f"Dexter Ingest Request: {request.data_type} for UCID: {request.ucid}")
        
        from app.db.session import SessionLocal
        from app.services.dexter.learning_engine import LearningEngine
        
        db = SessionLocal()
        try:
            learning_engine = LearningEngine(db)
            if request.data_type == "master_chart":
                await learning_engine.ingest_company_accounts(request.ucid)
            elif request.data_type == "mappings":
                await learning_engine.ingest_mappings(request.ucid)
            elif request.data_type == "rebuild":
                await learning_engine.rebuild_embeddings(request.ucid)
            else:
                logger.warning(f"Unknown data type for ingestion: {request.data_type}")
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
        finally:
            db.close()

    async def suggest_account(self, request: SuggestionRequest, db: Session) -> AccountSuggestion:
        """
        Active Mode: Suggest account for a transaction.
        """
        logger.info(f"Dexter Suggestion Request: {request.description}")
        
        from app.services.dexter.learning_engine import LearningEngine
        learning_engine = LearningEngine(db)
        
        query_vector = await learning_engine.get_embedding(request.description)
        
        similar_mappings = learning_engine.vector_store.search(request.ucid, query_vector, limit=3, entity_type="mapping")
        
        context_text = ""
        if similar_mappings:
            context_text += "Similar past mappings:\n" + "\n".join([f"- {doc.content}" for doc in similar_mappings])
        
        similar_accounts = learning_engine.vector_store.search(request.ucid, query_vector, limit=3, entity_type="account")
        if similar_accounts:
            context_text += "\nRelevant accounts:\n" + "\n".join([f"- {doc.content}" for doc in similar_accounts])
            
        prompt = f"""You are Dexter, an accounting assistant.
Suggest the best General Ledger account for the following transaction description.
Return ONLY a JSON object with keys: "account_code", "account_name", "confidence" (0.0-1.0), "reasoning".

Transaction: {request.description}

Context:
{context_text}

Response (JSON only):"""

        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=30.0
            )
            response.raise_for_status()
            result_json = response.json()["response"]
            
            try:
                result = json.loads(result_json)
                return AccountSuggestion(
                    account_code=result.get("account_code", "Unknown"),
                    account_name=result.get("account_name", "Unknown"),
                    confidence=result.get("confidence", 0.5),
                    reasoning=result.get("reasoning", "AI suggestion")
                )
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from AI: {result_json}")
                return AccountSuggestion(
                    account_code="Unknown",
                    account_name="Unknown",
                    confidence=0.0,
                    reasoning="Failed to parse AI response"
                )

    async def explain_account(self, code: str, detail_level: str, db: Session) -> AccountExplanation:
        """
        Explain a specific account in detail.
        """
        logger.info(f"Dexter Explain Account: {code}")
        
        from app.db.models.master_account import MasterAccount
        from app.services.master_template_service import get_template_service
        
        # Try to get from database first
        account = db.query(MasterAccount).filter(MasterAccount.code == code).first()
        
        # If not found, try template
        if not account:
            template_service = get_template_service()
            template_acc = template_service.get_template_account(code)
            if template_acc:
                # Create a mock object from template
                return AccountExplanation(
                    code=template_acc.get('code', ''),
                    description=template_acc.get('description', ''),
                    long_description=template_acc.get('long_description'),
                    category=template_acc.get('category', ''),
                    type=template_acc.get('type', ''),
                    normal_balance=template_acc.get('normal_balance', ''),
                    fs_mapping=template_acc.get('fs_mapping'),
                    purpose=self._extract_purpose(template_acc.get('detailed_description', '')),
                    when_to_use=self._extract_when_to_use(template_acc.get('detailed_description', '')),
                    when_not_to_use=self._extract_when_not_to_use(template_acc.get('detailed_description', '')),
                    related_accounts=self._find_related_accounts(code, db),
                    compliance_info={"regulatory_mapping": template_acc.get('regulatory_mapping')},
                    gaap_rationale=template_acc.get('gaap_classification'),
                )
            raise ValueError(f"Account {code} not found")
        
        # Build explanation from database account
        return AccountExplanation(
            code=account.code,
            description=account.description,
            long_description=account.long_description,
            category=account.category,
            type=account.type,
            normal_balance=account.normal_balance or '',
            fs_mapping=account.fs_mapping,
            purpose=self._extract_purpose(account.detailed_description or account.long_description or ''),
            when_to_use=self._extract_when_to_use(account.detailed_description or ''),
            when_not_to_use=self._extract_when_not_to_use(account.detailed_description or ''),
            related_accounts=self._find_related_accounts(code, db),
            compliance_info={"regulatory_mapping": account.regulatory_mapping} if account.regulatory_mapping else None,
            gaap_rationale=account.gaap_classification,
        )

    def _extract_purpose(self, text: str) -> str:
        """Extract purpose section from description."""
        if "Purpose:" in text:
            parts = text.split("Purpose:")
            if len(parts) > 1:
                purpose = parts[1].split("\n\n")[0].strip()
                return purpose
        return text[:200] if text else "No purpose description available."

    def _extract_when_to_use(self, text: str) -> List[str]:
        """Extract when to use examples."""
        examples = []
        if "Transaction Examples:" in text:
            parts = text.split("Transaction Examples:")
            if len(parts) > 1:
                section = parts[1].split("\n\n")[0]
                for line in section.split("\n"):
                    line = line.strip()
                    if line.startswith("-"):
                        examples.append(line[1:].strip())
        return examples if examples else ["Record transactions matching this category"]

    def _extract_when_not_to_use(self, text: str) -> List[str]:
        """Extract when not to use guidance."""
        if "When NOT to Use:" in text:
            parts = text.split("When NOT to Use:")
            if len(parts) > 1:
                section = parts[1].split("\n\n")[0]
                return [section.strip()]
        return ["Do not use for transactions outside this category"]

    def _find_related_accounts(self, code: str, db: Session) -> List[Dict[str, str]]:
        """Find accounts related to the given code."""
        from app.db.models.master_account import MasterAccount
        
        account = db.query(MasterAccount).filter(MasterAccount.code == code).first()
        related = []
        
        if account:
            # Get siblings (same parent)
            if account.parent_code:
                siblings = db.query(MasterAccount).filter(
                    MasterAccount.parent_code == account.parent_code,
                    MasterAccount.code != code
                ).limit(5).all()
                for sib in siblings:
                    related.append({"code": sib.code, "description": sib.description, "relation": "sibling"})
            
            # Get parent
            if account.parent_code:
                parent = db.query(MasterAccount).filter(MasterAccount.code == account.parent_code).first()
                if parent:
                    related.append({"code": parent.code, "description": parent.description, "relation": "parent"})
            
            # Get children
            children = db.query(MasterAccount).filter(MasterAccount.parent_code == code).limit(5).all()
            for child in children:
                related.append({"code": child.code, "description": child.description, "relation": "child"})
        
        return related

    async def generate_report(self, request: ReportRequest, db: Session) -> ReportResponse:
        """
        Generate financial reports based on the COA data.
        """
        logger.info(f"Dexter Generate Report: {request.report_type}")
        
        from app.db.models.master_account import MasterAccount
        
        accounts = db.query(MasterAccount).all()
        
        if request.report_type.value == "category_summary":
            return self._generate_category_summary(accounts)
        elif request.report_type.value == "hierarchy_analysis":
            return self._generate_hierarchy_analysis(accounts)
        elif request.report_type.value == "expense_breakdown":
            return self._generate_expense_breakdown(accounts)
        elif request.report_type.value == "asset_liability_delta":
            return self._generate_balance_sheet_summary(accounts)
        else:
            # Generic report
            return ReportResponse(
                report_type=request.report_type.value,
                title=f"{request.report_type.value.replace('_', ' ').title()} Report",
                summary="Report generated successfully",
                data={"total_accounts": len(accounts)},
                charts=[],
                generated_at=datetime.utcnow().isoformat(),
            )

    def _generate_category_summary(self, accounts: List) -> ReportResponse:
        """Generate category breakdown report."""
        categories = {}
        for acc in accounts:
            cat = acc.category or "Unknown"
            if cat not in categories:
                categories[cat] = {"count": 0, "headers": 0, "details": 0}
            categories[cat]["count"] += 1
            if acc.type == "H":
                categories[cat]["headers"] += 1
            else:
                categories[cat]["details"] += 1
        
        chart_data = [{"name": k, "value": v["count"]} for k, v in categories.items()]
        
        return ReportResponse(
            report_type="category_summary",
            title="Chart of Accounts Category Summary",
            summary=f"The chart contains {len(accounts)} accounts across {len(categories)} categories.",
            data={"categories": categories, "total": len(accounts)},
            charts=[{
                "type": "pie",
                "title": "Accounts by Category",
                "data": chart_data
            }],
            generated_at=datetime.utcnow().isoformat(),
            recommendations=[
                "Review categories with few accounts for potential consolidation",
                "Ensure header accounts exist for each category"
            ]
        )

    def _generate_hierarchy_analysis(self, accounts: List) -> ReportResponse:
        """Generate hierarchy analysis report."""
        levels = {}
        orphans = []
        account_codes = {acc.code for acc in accounts}
        
        for acc in accounts:
            level = acc.level
            if level not in levels:
                levels[level] = 0
            levels[level] += 1
            
            if acc.parent_code and acc.parent_code not in account_codes:
                orphans.append(acc.code)
        
        return ReportResponse(
            report_type="hierarchy_analysis",
            title="Chart of Accounts Hierarchy Analysis",
            summary=f"The chart has {max(levels.keys()) if levels else 0} levels of depth with {len(orphans)} orphan accounts.",
            data={
                "levels": levels,
                "orphans": orphans,
                "max_depth": max(levels.keys()) if levels else 0,
            },
            charts=[{
                "type": "bar",
                "title": "Accounts by Level",
                "data": [{"level": k, "count": v} for k, v in sorted(levels.items())]
            }],
            generated_at=datetime.utcnow().isoformat(),
            recommendations=[
                f"Fix {len(orphans)} orphan accounts by assigning valid parents" if orphans else "Hierarchy is clean - no orphans detected"
            ]
        )

    def _generate_expense_breakdown(self, accounts: List) -> ReportResponse:
        """Generate expense accounts breakdown."""
        expense_accounts = [acc for acc in accounts if acc.category == "Expense"]
        subcategories = {}
        
        for acc in expense_accounts:
            subcat = acc.subcategory or "Uncategorized"
            if subcat not in subcategories:
                subcategories[subcat] = 0
            subcategories[subcat] += 1
        
        return ReportResponse(
            report_type="expense_breakdown",
            title="Expense Accounts Breakdown",
            summary=f"Found {len(expense_accounts)} expense accounts across {len(subcategories)} subcategories.",
            data={"subcategories": subcategories, "total_expense_accounts": len(expense_accounts)},
            charts=[{
                "type": "bar",
                "title": "Expense Accounts by Subcategory",
                "data": [{"name": k, "count": v} for k, v in sorted(subcategories.items(), key=lambda x: -x[1])][:10]
            }],
            generated_at=datetime.utcnow().isoformat(),
        )

    def _generate_balance_sheet_summary(self, accounts: List) -> ReportResponse:
        """Generate balance sheet summary."""
        assets = [acc for acc in accounts if acc.category == "Asset"]
        liabilities = [acc for acc in accounts if acc.category == "Liability"]
        equity = [acc for acc in accounts if acc.category == "Equity"]
        
        return ReportResponse(
            report_type="asset_liability_delta",
            title="Balance Sheet Structure Summary",
            summary=f"Balance sheet accounts: {len(assets)} assets, {len(liabilities)} liabilities, {len(equity)} equity.",
            data={
                "asset_count": len(assets),
                "liability_count": len(liabilities),
                "equity_count": len(equity),
            },
            charts=[{
                "type": "pie",
                "title": "Balance Sheet Structure",
                "data": [
                    {"name": "Assets", "value": len(assets)},
                    {"name": "Liabilities", "value": len(liabilities)},
                    {"name": "Equity", "value": len(equity)},
                ]
            }],
            generated_at=datetime.utcnow().isoformat(),
        )

    async def get_insights(self, request: InsightRequest, db: Session) -> InsightsResponse:
        """
        Generate insights about the COA.
        """
        logger.info(f"Dexter Get Insights: {request.insight_type}")
        
        from app.db.models.master_account import MasterAccount
        
        accounts = db.query(MasterAccount).all()
        account_codes = {acc.code for acc in accounts}
        insights: List[Insight] = []
        
        # Check for duplicate descriptions
        if request.insight_type.value in ["duplicate_accounts", "all"]:
            descriptions = {}
            for acc in accounts:
                desc = acc.description.lower().strip()
                if desc in descriptions:
                    descriptions[desc].append(acc.code)
                else:
                    descriptions[desc] = [acc.code]
            
            for desc, codes in descriptions.items():
                if len(codes) > 1:
                    insights.append(Insight(
                        type="duplicate_accounts",
                        severity="medium",
                        title="Potential Duplicate Accounts",
                        description=f"Multiple accounts share the description: '{desc}'",
                        affected_items=codes,
                        recommendation="Review these accounts and consider consolidating if they serve the same purpose",
                        auto_fix_available=False,
                    ))
        
        # Check for orphan accounts
        if request.insight_type.value in ["inconsistent_hierarchies", "all"]:
            for acc in accounts:
                if acc.parent_code and acc.parent_code not in account_codes:
                    insights.append(Insight(
                        type="inconsistent_hierarchies",
                        severity="high",
                        title="Orphan Account Detected",
                        description=f"Account {acc.code} references non-existent parent {acc.parent_code}",
                        affected_items=[acc.code],
                        recommendation=f"Create parent account {acc.parent_code} or reassign this account",
                        auto_fix_available=True,
                    ))
        
        # Check for detail accounts with children
        if request.insight_type.value in ["inconsistent_hierarchies", "all"]:
            parent_codes = {acc.parent_code for acc in accounts if acc.parent_code}
            for acc in accounts:
                if acc.type == "D" and acc.code in parent_codes:
                    insights.append(Insight(
                        type="inconsistent_hierarchies",
                        severity="medium",
                        title="Detail Account Has Children",
                        description=f"Account {acc.code} is a Detail type but has child accounts",
                        affected_items=[acc.code],
                        recommendation="Change the account type to Header or reorganize children",
                        auto_fix_available=True,
                    ))
        
        # Check for missing required fields
        if request.insight_type.value in ["anomalies", "all"]:
            for acc in accounts:
                if not acc.normal_balance:
                    insights.append(Insight(
                        type="anomalies",
                        severity="low",
                        title="Missing Normal Balance",
                        description=f"Account {acc.code} does not have a normal balance defined",
                        affected_items=[acc.code],
                        recommendation="Set normal balance based on account category",
                        auto_fix_available=True,
                    ))
        
        # Count by severity
        by_severity = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for insight in insights:
            by_severity[insight.severity] = by_severity.get(insight.severity, 0) + 1
        
        return InsightsResponse(
            total_insights=len(insights),
            by_severity=by_severity,
            insights=insights[:50],  # Limit response size
            generated_at=datetime.utcnow().isoformat(),
        )


# Global instance
dexter_engine = DexterEngine()
