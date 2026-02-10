from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.models.embedding import Embedding
from typing import List, Dict, Any, Optional
from pgvector.sqlalchemy import Vector

class VectorStore:
    def __init__(self, db: Session):
        self.db = db

    def add_embedding(self, company_ucid: str, entity_type: str, content: str, vector: List[float], metadata: Dict[str, Any] = None):
        """
        Adds a single embedding to the store.
        """
        embedding = Embedding(
            company_ucid=company_ucid,
            entity_type=entity_type,
            content=content,
            vector=vector,
            meta_data=metadata
        )
        self.db.add(embedding)
        self.db.commit()

    def search(self, company_ucid: str, query_vector: List[float], limit: int = 5, entity_type: Optional[str] = None) -> List[Embedding]:
        """
        Searches for similar embeddings within a company's knowledge base.
        """
        stmt = select(Embedding).filter(Embedding.company_ucid == company_ucid)
        
        if entity_type:
            stmt = stmt.filter(Embedding.entity_type == entity_type)
            
        # L2 distance (Euclidean) is default for pgvector usually, but cosine is better for embeddings.
        # If vector is normalized, L2 is equivalent to cosine.
        # pgvector supports cosine operator <=> (cosine distance).
        # We use order_by(Embedding.vector.cosine_distance(query_vector))
        
        stmt = stmt.order_by(Embedding.vector.cosine_distance(query_vector)).limit(limit)
        
        return self.db.scalars(stmt).all()

    def delete_company_embeddings(self, company_ucid: str):
        """
        Deletes all embeddings for a company (e.g. for rebuild).
        """
        self.db.query(Embedding).filter(Embedding.company_ucid == company_ucid).delete()
        self.db.commit()
