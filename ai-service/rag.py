import logging
import chromadb
from chromadb.config import Settings
from embedder import embed_texts, build_repo_documents
from typing import List

logger = logging.getLogger(__name__)

_client = chromadb.Client(Settings(anonymized_telemetry=False))

def build_collection(analysis_id: str, repos: List[dict]) -> chromadb.Collection:
    """Build a per-analysis vector collection from the scraped repos."""
    collection_name = f"repos_{analysis_id}"
    logger.info("build_collection START — analysis_id=%s repos=%d", analysis_id, len(repos))

    try:
        _client.delete_collection(collection_name)
        logger.debug("Deleted existing collection '%s'.", collection_name)
    except Exception:
        pass

    collection = _client.create_collection(collection_name)
    docs = build_repo_documents(repos)

    if not docs:
        logger.warning("analysis_id=%s — no documents to embed; empty collection created.", analysis_id)
        return collection

    try:
        embeddings = embed_texts(docs)
        collection.add(
            documents=docs,
            embeddings=embeddings,
            ids=[f"repo_{i}" for i in range(len(docs))],
        )
        logger.info(
            "build_collection DONE — analysis_id=%s %d docs embedded.",
            analysis_id, len(docs),
        )
    except Exception as exc:
        logger.error(
            "build_collection FAILED — analysis_id=%s: %s", analysis_id, exc, exc_info=True
        )
        raise

    return collection

def query_collection(analysis_id: str, query: str, n_results: int = 5) -> List[str]:
    """Retrieve the most semantically relevant repo docs for a query."""
    logger.debug(
        "query_collection — analysis_id=%s query='%s' n_results=%d",
        analysis_id, query, n_results,
    )
    try:
        collection = _client.get_collection(f"repos_{analysis_id}")
        query_embedding = embed_texts([query])[0]
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, collection.count()),
        )
        docs = results["documents"][0] if results["documents"] else []
        logger.debug("query_collection returned %d docs.", len(docs))
        return docs
    except Exception as exc:
        logger.error(
            "query_collection FAILED — analysis_id=%s: %s", analysis_id, exc, exc_info=True
        )
        return []

def cleanup_collection(analysis_id: str):
    logger.info("Cleaning up collection for analysis_id=%s", analysis_id)
    try:
        _client.delete_collection(f"repos_{analysis_id}")
        logger.debug("Collection deleted — analysis_id=%s", analysis_id)
    except Exception as exc:
        logger.warning("Cleanup skipped (collection may not exist): %s", exc)