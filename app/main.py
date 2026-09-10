import os
import sys
import asyncio
from pathlib import Path

# Ensure project root is in sys.path when executed directly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logger import logger
from app.parser.query_extractor import extract_search_intent
from app.scraper.crawler import scrape_bis_data
from app.rag.vector_store import retrieve_best_context
from app.llm.engine import generate_answer

app = FastAPI(
    title="BIS AI Assistant API",
    description="Live Scraper + Dynamic RAG + Dual-Engine (Ollama / Gemini) Fallback for Bureau of Indian Standards",
    version="1.0.0",
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from typing import List, Dict, Any, Optional
from app.scraper.bis_auth import get_bis_auth_status, login_to_bis, download_standard_pdf


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Citizen or applicant query")


class QueryResponse(BaseModel):
    query: str
    answer: str
    engine: str
    source_url: str
    category: str
    extracted_keywords: list[str]
    matched_standards: list[dict] = []
    primary_preview: str = ""


class BisLoginRequest(BaseModel):
    username: str = Field("", description="Registered email/username on standardsbis.bsbedge.com")
    password: str = Field("", description="Password on standardsbis.bsbedge.com")
    captcha_code: str = Field("", description="Optional captcha code if manual input required")


class BisDownloadRequest(BaseModel):
    preview_id: str = Field(..., description="ID of the standard or preview")
    is_number: str = Field("", description="Full standard number e.g. IS 1417 : 2016")


@app.get("/api/health")
async def health_check():
    """Health check and configuration inspection."""
    bis_status = get_bis_auth_status()
    return {
        "status": "healthy",
        "local_model": settings.LOCAL_MODEL,
        "gemini_model": settings.GEMINI_MODEL,
        "ollama_url": settings.OLLAMA_BASE_URL,
        "gemini_configured": bool(settings.GEMINI_API_KEY.strip()),
        "bis_authenticated": bis_status["authenticated"],
        "bis_user": bis_status["username"],
    }


@app.get("/api/bis/status")
async def bis_auth_status():
    """Returns current BIS login authentication state."""
    return get_bis_auth_status()


@app.post("/api/bis/login")
async def handle_bis_login(request: BisLoginRequest):
    """
    Authenticates user credentials on official BIS portal (standardsbis.bsbedge.com).
    Solves captcha with Gemini Vision or manual fallback.
    """
    result = await login_to_bis(
        username=request.username,
        password=request.password,
        captcha_code=request.captcha_code,
    )
    return result


@app.post("/api/bis/download")
async def handle_bis_download(request: BisDownloadRequest):
    """
    Downloads official Indian Standard PDF using saved BIS session.
    Parses PDF text and stores document in downloads/ directory.
    """
    result = await download_standard_pdf(
        preview_id=request.preview_id,
        is_number=request.is_number,
    )
    return result


@app.get("/api/bis/pdf/{filename}")
async def serve_downloaded_pdf(filename: str):
    """Serves a downloaded Indian Standard PDF document."""
    safe_filename = Path(filename).name
    pdf_path = settings.DOWNLOADS_DIR / safe_filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Requested standard PDF not found.")
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=safe_filename,
    )


@app.post("/api/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest):
    """
    End-to-end BIS Assistant pipeline:
    1. Extract keywords & category via query_extractor.py
    2. Live scrape canonical BIS portal / standards catalog via crawler.py & standards_scraper.py
    3. Index and retrieve top context via in-memory vector_store.py
    4. Synthesize verified answer via dual-engine fallback engine.py
    """
    user_query = request.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    logger.info(f"--- New Query Received: '{user_query}' ---")

    # Step 1: Query Intent Extraction (non-blocking thread)
    intent = await asyncio.to_thread(extract_search_intent, user_query)
    category = intent.get("category", "standards")
    keywords = intent.get("keywords", ["bis", "standards"])
    keywords_str = " ".join(keywords)
    conversational_intent = intent.get("conversational_intent")
    is_general = (category == "general" or bool(conversational_intent))

    # Step 2: Live Scrape BIS Portal Section & Standards Catalog (or fast bypass for general queries)
    scraped_result = await scrape_bis_data(
        category=category,
        keywords=keywords_str,
        user_query=user_query,
    )
    source_url = scraped_result.get("url", "https://standardsbis.bsbedge.com/")
    scraped_text = scraped_result.get("text", "")
    matched_standards = scraped_result.get("matched_standards", [])
    primary_preview = scraped_result.get("primary_preview", "")

    # Step 3: In-Memory Dynamic RAG Retrieval
    if is_general:
        # Fast bypass: use overview context directly without ephemeral ChromaDB overhead
        retrieved_context = scraped_text
    else:
        retrieved_context = await asyncio.to_thread(
            retrieve_best_context,
            scraped_text=scraped_text,
            query=user_query,
            top_k=3,
        )

    # Step 4: Dual-Engine LLM Generation (non-blocking thread with circuit breaker)
    generation_result = await asyncio.to_thread(
        generate_answer,
        query=user_query,
        retrieved_context=retrieved_context,
        source_url=source_url,
        is_general=is_general,
        intent_type=conversational_intent or "",
    )

    return QueryResponse(
        query=user_query,
        answer=generation_result["answer"],
        engine=generation_result["engine"],
        source_url=generation_result["source_url"],
        category=category,
        extracted_keywords=keywords,
        matched_standards=matched_standards,
        primary_preview=primary_preview,
    )



# Mount frontend static assets
BASE_DIR = Path(__file__).resolve().parent.parent
frontend_dir = BASE_DIR / "frontend"

if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(frontend_dir / "index.html")
    
    @app.get("/style.css")
    async def serve_css():
        return FileResponse(frontend_dir / "style.css")

    @app.get("/app.js")
    async def serve_js():
        return FileResponse(frontend_dir / "app.js")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
