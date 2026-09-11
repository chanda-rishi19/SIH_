import os
import sys
import asyncio
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from backend.core.config import settings
from backend.core.logger import logger
from backend.parser.query_extractor import extract_search_intent
from backend.scraper.crawler import scrape_bis_data
from backend.rag.vector_store import retrieve_best_context
from backend.llm.engine import generate_answer
app = FastAPI(
    title="BIS AI Assistant API",
    description="Live Scraper + Dynamic RAG + Dual-Engine (Ollama / Gemini) Fallback for Bureau of Indian Standards",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from typing import List, Dict, Any, Optional
from backend.scraper.bis_auth import get_bis_auth_status, login_to_bis, download_standard_pdf
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=10000, description="Citizen or applicant query")
    attachment_name: Optional[str] = Field(None, description="Filename of attached photo or document")
    attachment_type: Optional[str] = Field(None, description="'image' or 'document'")
    attachment_data: Optional[str] = Field(None, description="Base64 data URI of the attachment")
    language: Optional[str] = Field("en", description="Target response language code (e.g. en, hi, ta, te, bn, mr, gu, kn)")
class QueryResponse(BaseModel):
    query: str
    answer: str
    engine: str
    source_url: str
    category: str
    extracted_keywords: list[str]
    matched_standards: list[dict] = []
    primary_preview: str = ""

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Markdown or plain text to translate")
    target_language: str = Field("en", description="Target language code (e.g. en, hi, ta, te, bn, mr, gu, kn)")
    source_language: Optional[str] = Field("auto", description="Source language code")

class TranslateResponse(BaseModel):
    translated_text: str
    target_language: str
from backend.llm.translator import translate_text
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


@app.post("/api/translate", response_model=TranslateResponse)
async def handle_translate(request: TranslateRequest):
    """
    Translates technical guidance text into specified Indian language.
    Preserves IS numbers, acronyms, percentages, and markdown structure.
    """
    translated = await asyncio.to_thread(
        translate_text,
        text=request.text,
        target_language=request.target_language,
        source_language=request.source_language or "auto",
    )
    return TranslateResponse(
        translated_text=translated,
        target_language=request.target_language,
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
    image_bytes = None
    mime_type = None
    doc_context = ""
    if request.attachment_data and request.attachment_type:
        try:
            import base64
            import io
            data_str = request.attachment_data
            header = ""
            if "," in data_str:
                header, b64_content = data_str.split(",", 1)
            else:
                b64_content = data_str

            file_bytes = base64.b64decode(b64_content)

            if request.attachment_type == "image":
                image_bytes = file_bytes
                if "image/png" in header:
                    mime_type = "image/png"
                elif "image/webp" in header:
                    mime_type = "image/webp"
                else:
                    mime_type = "image/jpeg"
                logger.info(f"Received attached image: {request.attachment_name or 'photo'} ({len(image_bytes)} bytes)")

            elif request.attachment_type == "document":
                att_name = (request.attachment_name or "").lower()
                if att_name.endswith(".pdf") or "application/pdf" in header:
                    try:
                        import pypdf
                        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                        pages_text = []
                        for page in reader.pages[:10]:
                            t = page.extract_text()
                            if t:
                                pages_text.append(t.strip())
                        doc_context = "\n\n".join(pages_text)
                        logger.info(f"Extracted {len(doc_context)} chars from attached PDF: {request.attachment_name}")
                    except Exception as pdf_err:
                        logger.warning(f"Could not parse attached PDF: {pdf_err}")
                        doc_context = f"[PDF Document Attached: {request.attachment_name}]"
                else:
                    try:
                        doc_context = file_bytes.decode("utf-8", errors="ignore")
                        logger.info(f"Extracted {len(doc_context)} chars from attached text/csv document")
                    except Exception as text_err:
                        logger.warning(f"Could not decode document text: {text_err}")
        except Exception as att_err:
            logger.warning(f"Error processing attachment: {att_err}")
    intent = await asyncio.to_thread(extract_search_intent, user_query)
    category = intent.get("category", "standards")
    keywords = intent.get("keywords", ["bis", "standards"])
    keywords_str = " ".join(keywords)
    conversational_intent = intent.get("conversational_intent")
    is_general = (category == "general" or bool(conversational_intent))
    scraped_result = await scrape_bis_data(
        category=category,
        keywords=keywords_str,
        user_query=user_query,
    )
    source_url = scraped_result.get("url", "https://standardsbis.bsbedge.com/")
    scraped_text = scraped_result.get("text", "")
    matched_standards = scraped_result.get("matched_standards", [])
    primary_preview = scraped_result.get("primary_preview", "")
    if is_general:
        retrieved_context = scraped_text
    else:
        retrieved_context = await asyncio.to_thread(
            retrieve_best_context,
            scraped_text=scraped_text,
            query=user_query,
            top_k=3,
        )
    if doc_context:
        retrieved_context = (
            f"--- USER ATTACHED DOCUMENT ({request.attachment_name or 'Document'}) ---\n"
            f"{doc_context[:5000]}\n"
            f"----------------------------------------------------\n\n"
            f"{retrieved_context}"
        )
    generation_result = await asyncio.to_thread(
        generate_answer,
        query=user_query,
        retrieved_context=retrieved_context,
        source_url=source_url,
        is_general=is_general,
        intent_type=conversational_intent or "",
        image_bytes=image_bytes,
        mime_type=mime_type,
        language=request.language or "en",
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
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
