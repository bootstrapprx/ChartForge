import httpx
import logging
import os
from sqlalchemy.orm import Session
from app.services.dexter.vector_store import VectorStore

logger = logging.getLogger(__name__)

class LearningEngine:
    def __init__(self, db: Session):
        self.db = db
        self.vector_store = VectorStore(db)
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        self.model_name = os.getenv("ORGANIZER_MODEL_NAME", "qwen2.5-coder:1.5b")

    async def get_embedding(self, text: str) -> list[float]:
        """
        Generates embedding for text using Ollama.
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.ollama_base_url}/api/embed",
                    json={
                        "model": self.model_name,
                        "input": text
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()["embeddings"][0]
            except Exception as e:
                logger.error(f"Error generating embedding: {e}")
                raise e

    async def ingest_company_accounts(self, ucid: str):
        """
        Ingests the Company's Chart of Accounts.
        """
        logger.info(f"Ingesting Company Accounts for {ucid}...")
        from app.services.company_service import CompanyService
        company = CompanyService.get_company_by_ucid(self.db, ucid)
        if not company:
            logger.warning(f"Company {ucid} not found for ingestion.")
            return

        accounts = company.accounts
        
        for account in accounts:
            text = f"Account Code: {account.account_code}, Name: {account.account_name}, Type: {account.account_type}, Description: {account.description or ''}"
            vector = await self.get_embedding(text)
            self.vector_store.add_embedding(
                company_ucid=ucid,
                entity_type="account",
                content=text,
                vector=vector,
                metadata={"code": account.account_code, "name": account.account_name, "id": str(account.id)}
            )
        logger.info(f"Ingested {len(accounts)} accounts for {ucid}.")

    async def ingest_mappings(self, ucid: str):
        """
        Ingests Mappings for a company.
        """
        logger.info(f"Ingesting Mappings for {ucid}...")
        from app.services.mapping_service import MappingService
        mappings = MappingService.get_mappings(self.db, ucid)
        
        for mapping in mappings:
            # Assuming mapping has source_description or we get it from company_account
            # Mapping model usually links CompanyAccount and MasterAccount
            # We need to fetch related data if not eager loaded
            source_acc = mapping.company_account
            target_acc = mapping.master_account
            
            if source_acc and target_acc:
                text = f"Mapping: '{source_acc.account_name}' ({source_acc.account_code}) maps to Master Account {target_acc.code} ({target_acc.name})"
                vector = await self.get_embedding(text)
                self.vector_store.add_embedding(
                    company_ucid=ucid,
                    entity_type="mapping",
                    content=text,
                    vector=vector,
                    metadata={"source_code": source_acc.account_code, "target_code": target_acc.code}
                )
        logger.info(f"Ingested {len(mappings)} mappings for {ucid}.")

    async def rebuild_embeddings(self, ucid: str):
        """
        Rebuilds all embeddings for a company.
        """
        logger.info(f"Rebuilding embeddings for {ucid}...")
        self.vector_store.delete_company_embeddings(ucid)
        await self.ingest_company_accounts(ucid)
        await self.ingest_mappings(ucid)
        # await self.ingest_ledger(ucid) # TODO
        logger.info(f"Rebuild complete for {ucid}.")
