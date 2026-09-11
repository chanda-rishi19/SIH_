import re
import uuid
from typing import List
import chromadb
from chromadb.utils import embedding_functions
from backend.core.logger import logger
def _chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    """Chunks text into discrete, semantically intact sentence blocks of approximately 500 characters."""
    if not text:
        return []
    cleaned_text = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", cleaned_text)
    chunks: List[str] = []
    current_chunk = []
    current_length = 0
    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue
        sent_len = len(sent)
        if current_length + sent_len > chunk_size and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sent]
            current_length = sent_len
        else:
            current_chunk.append(sent)
            current_length += sent_len
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    if not chunks and text.strip(): 
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i : i + chunk_size].strip())
    return [c for c in chunks if len(c) > 20]
def _keyword_similarity_fallback(chunks: List[str], query: str, top_k: int = 3) -> str:
    """Keyword-based ranking fallback if vector store embedding is unavailable."""
    query_words = set(re.findall(r"\w+", query.lower()))
    scored = []
    for chunk in chunks:
        chunk_words = set(re.findall(r"\w+", chunk.lower()))
        overlap = len(query_words.intersection(chunk_words))
        scored.append((overlap, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    selected = [c for score, c in scored[:top_k]]
    return "\n\n---\n\n".join(selected)
def retrieve_best_context(scraped_text: str, query: str, top_k: int = 3) -> str:
    """Indexes scraped text into an ephemeral in-memory ChromaDB instance and retrieves
    the top-k semantically relevant chunks for the user query."""
    if not scraped_text or not scraped_text.strip():
        logger.warning("Empty scraped text received for RAG retrieval.")
        return "No specific context available from the portal."
    chunks = _chunk_text(scraped_text, chunk_size=500)
    if not chunks:
        return scraped_text[:1500]
    logger.info(f"Chunked scraped text into {len(chunks)} discrete segments.")
    try:
        # Spin up an ephemeral, in-memory ChromaDB client
        client = chromadb.Client()
        embed_fn = embedding_functions.DefaultEmbeddingFunction()
        collection_name = f"bis_rag_{uuid.uuid4().hex[:12]}"
        collection = client.create_collection(
            name=collection_name,
            embedding_function=embed_fn,
            metadata={"hnsw:space": "cosine"},
        )
        collection.add(
            documents=chunks,
            ids=[f"chunk_{i}" for i in range(len(chunks))],
        )
        n_results = min(top_k, len(chunks))
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
        )
        retrieved_docs = results.get("documents", [[]])[0]
        if not retrieved_docs:
            logger.warning("ChromaDB returned empty results. Using keyword heuristic.")
            return _keyword_similarity_fallback(chunks, query, top_k=top_k)
        try:
            client.delete_collection(name=collection_name)
        except Exception:
            pass
        concatenated_context = "\n\n---\n\n".join(retrieved_docs)
        logger.info(f"Retrieved {len(retrieved_docs)} chunks via ChromaDB semantic search.")
        return concatenated_context
    except Exception as exc:
        logger.warning(
            f"ChromaDB retrieval encountered exception ({type(exc).__name__}: {exc}). "
            "Using fallback keyword-overlap ranking."
        )
        return _keyword_similarity_fallback(chunks, query, top_k=top_k)