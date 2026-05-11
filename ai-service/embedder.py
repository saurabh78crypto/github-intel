import logging
from sentence_transformers import SentenceTransformer
from typing import List

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading sentence-transformer model 'all-MiniLM-L6-v2'...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Model loaded and cached in memory.")
    return _model

def warmup_model() -> None:
    """
    Pre-load the embedding model at startup so the first analysis request
    is not penalised by a cold-start download.
    """
    logger.info("Warming up embedding model...")
    try:
        model = get_model()
        model.encode(["warmup"], show_progress_bar=False)
        logger.info("Embedding model warm-up complete.")
    except Exception as exc:
        logger.error("Embedding model warm-up FAILED: %s", exc, exc_info=True)
        raise

def embed_texts(texts: List[str]) -> List[List[float]]:
    logger.debug("Embedding %d text(s)...", len(texts))
    try:
        model = get_model()
        embeddings = model.encode(texts, show_progress_bar=False)
        logger.debug("Embedding complete.")
        return embeddings.tolist()
    except Exception as exc:
        logger.error("Failed to embed texts: %s", exc, exc_info=True)
        raise

def build_repo_documents(repos: List[dict]) -> List[str]:
    """Convert repo dicts into plain-text documents for embedding."""
    docs: List[str] = []
    for repo in repos:
        doc = (
            f"Repository: {repo['name']}\n"
            f"Language: {repo['language']}\n"
            f"Description: {repo['description']}\n"
            f"Topics: {', '.join(repo['topics']) if repo['topics'] else 'none'}\n"
            f"Stars: {repo['stars']} | Forks: {repo['forks']}\n"
            f"README excerpt: {repo['readme'][:500] if repo['readme'] else 'No README'}"
        )
        docs.append(doc)
    logger.debug("Built %d repo documents for embedding.", len(docs))
    return docs