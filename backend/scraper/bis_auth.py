import os
import re
import json
import base64
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from backend.core.config import settings
from backend.core.logger import logger
BIS_PORTAL_BASE = "https://standardsbis.bsbedge.com"
LOGIN_URL = f"{BIS_PORTAL_BASE}/BIS_Login"
def get_bis_auth_status() -> Dict[str, Any]:
    """Returns current BIS login and session status."""
    has_session = settings.SESSION_FILE.exists() and settings.SESSION_FILE.stat().st_size > 50
    username = settings.BIS_USERNAME or ""
    cookies_count = 0
    if has_session:
        try:
            with open(settings.SESSION_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                cookies = data.get("cookies", [])
                cookies_count = len(cookies)
                # Check for expiration
                if not cookies:
                    has_session = False
        except Exception:
            has_session = False
    return {
        "authenticated": has_session and cookies_count > 0,
        "username": username,
        "cookies_count": cookies_count,
        "has_credentials": bool(settings.BIS_USERNAME and settings.BIS_PASSWORD),
    }
def extract_pdf_text(pdf_path: Path, max_pages: int = 20) -> str:
    """Extracts text content from a downloaded Indian Standard PDF using pypdf."""
    if not pdf_path.exists():
        return ""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(pdf_path))
        pages_text = []
        total_pages = len(reader.pages)
        for idx in range(min(total_pages, max_pages)):
            pt = reader.pages[idx].extract_text()
            if pt and pt.strip():
                pages_text.append(f"--- Standard Document Page {idx + 1} of {total_pages} ---\n{pt.strip()}")
        logger.info(f"Extracted text from {len(pages_text)} pages of {pdf_path.name}")
        return "\n\n".join(pages_text)
    except Exception as exc:
        logger.warning(f"Failed to extract PDF text from {pdf_path}: {exc}")
        return ""
def _solve_captcha_with_gemini(image_bytes: bytes) -> str:
    """Uses Gemini 2.5 Flash Vision to solve the plain text BIS captcha."""
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        return ""
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        prompt = (
            "This image contains a simple 6 to 8 character alphanumeric captcha code for the Bureau of Indian Standards portal. "
            "Output strictly the exact characters in lowercase without spaces, punctuation, or any other words."
        )
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
                prompt,
            ],
        )
        solved = re.sub(r"[^a-zA-Z0-9]", "", response.text or "").strip().lower()
        logger.info(f"Gemini Vision solved BIS captcha: '{solved}'")
        return solved
    except Exception as exc:
        logger.warning(f"Gemini captcha solver notice: {exc}")
        return ""
async def login_to_bis(
    username: str = "",
    password: str = "",
    captcha_code: str = "",
) -> Dict[str, Any]:
    """Logs in to standardsbis.bsbedge.com using Playwright.
    Solves captcha automatically or accepts manual captcha code.
    Saves session cookies to bis_session.json."""
    user = username.strip() or settings.BIS_USERNAME.strip()
    pwd = password.strip() or settings.BIS_PASSWORD.strip()
    if not user or not pwd:
        return {
            "status": "error",
            "message": "BIS username and password are required. Please provide credentials.",
        }
    logger.info(f"Initiating BIS login automation for user: '{user}'")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()
        try:
            await page.goto(LOGIN_URL, wait_until="networkidle", timeout=20000)
            captcha_img = await page.wait_for_selector("#imgCaptcha", timeout=8000)
            captcha_bytes = await captcha_img.screenshot()
            captcha_base64 = base64.b64encode(captcha_bytes).decode("utf-8")
            solution = captcha_code.strip()
            if not solution:
                solution = _solve_captcha_with_gemini(captcha_bytes)
            if not solution:
                await browser.close()
                return {
                    "status": "captcha_needed",
                    "captcha_image": f"data:image/png;base64,{captcha_base64}",
                    "message": "Captcha solving required. Please enter the captcha characters shown.",
                }
            await page.fill("#ctl00_ContentPlaceHolder1_T1_txtUser", user)
            await page.fill("#ctl00_ContentPlaceHolder1_T1_txtPass", pwd)
            await page.fill("#ctl00_ContentPlaceHolder1_T1_captcha", solution)
            logger.info("Submitting BIS login form...")
            await page.click("#ctl00_ContentPlaceHolder1_T1_btn_submit")
            try:
                await page.wait_for_load_state("networkidle", timeout=10000)
            except Exception:
                pass
            content = await page.content()
            is_logged_in = (
                "My Account" in content
                or "Sign Out" in content
                or "Logout" in content
                or "BIS_SearchStandard" in page.url
                or page.url.endswith(".aspx") and not page.url.endswith("BIS_Login")
            )
            if is_logged_in:
                await context.storage_state(path=str(settings.SESSION_FILE))
                logger.info(f"BIS login successful for user '{user}'. Session saved to {settings.SESSION_FILE.name}")
                await browser.close()
                return {
                    "status": "success",
                    "message": f"Successfully authenticated as {user}. Session active.",
                    "username": user,
                }
            else:
                soup = BeautifulSoup(content, "html.parser")
                notice_el = soup.find(id=re.compile(r"lblnotice|lbl_error|error", re.I))
                err_msg = notice_el.get_text(strip=True) if notice_el else ""
                try:
                    new_img = await page.wait_for_selector("#imgCaptcha", timeout=3000)
                    new_bytes = await new_img.screenshot()
                    new_b64 = base64.b64encode(new_bytes).decode("utf-8")
                except Exception:
                    new_b64 = ""
                await browser.close()
                return {
                    "status": "error",
                    "message": err_msg or "Authentication failed. Please verify your credentials or captcha.",
                    "captcha_image": f"data:image/png;base64,{new_b64}" if new_b64 else "",
                }
        except Exception as exc:
            logger.error(f"BIS login automation error: {exc}")
            await browser.close()
            return {
                "status": "error",
                "message": f"Login automation error: {str(exc)}",
            }
async def download_standard_pdf(preview_id: str, is_number: str = "") -> Dict[str, Any]:
    """Downloads official Indian Standard PDF using saved BIS session.
    Saves PDF to downloads/IS_{safe_id}.pdf and extracts text for RAG."""
    clean_id = re.sub(r"[^a-zA-Z0-9_-]", "_", preview_id or is_number or "standard").strip("_")
    filename = f"IS_{clean_id}.pdf"
    target_path = settings.DOWNLOADS_DIR / filename
    if target_path.exists() and target_path.stat().st_size > 1000:
        logger.info(f"PDF already exists locally: {target_path}")
        text = extract_pdf_text(target_path)
        return {
            "status": "success",
            "filename": filename,
            "file_path": str(target_path),
            "download_url": f"/api/bis/pdf/{filename}",
            "already_downloaded": True,
            "extracted_text": text,
        }
    if not settings.SESSION_FILE.exists() or settings.SESSION_FILE.stat().st_size < 50:
        return {
            "status": "login_required",
            "message": "BIS credentials or active session required to download full official PDF documents.",
            "is_number": is_number,
            "preview_id": preview_id,
        }
    logger.info(f"Attempting authenticated PDF download for standard: {is_number or preview_id}")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context(
            storage_state=str(settings.SESSION_FILE),
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            accept_downloads=True,
        )
        page = await context.new_page()

        try:
            # Search for the standard
            search_term = is_number or preview_id
            search_num = re.search(r'\d+', search_term)
            query_param = f"Standard_Number={search_num.group(0)}" if search_num else f"keyword={urllib.parse.quote(search_term)}"
            search_url = f"{BIS_PORTAL_BASE}/BIS_SearchStandard.aspx?{query_param}&id=0"

            logger.info(f"Navigating to download page: {search_url}")
            await page.goto(search_url, wait_until="networkidle", timeout=20000)

            # Find download button/link
            download_btn = await page.query_selector("a:has-text('Download'), a:has-text('Download PDF'), a.quickview[href*='Download']")
            if not download_btn:
                # Check if still shows 'Login to Download'
                login_btn = await page.query_selector("a:has-text('Login to Download')")
                if login_btn:
                    await browser.close()
                    return {
                        "status": "session_expired",
                        "message": "BIS session has expired. Please log in again.",
                    }

            if not download_btn:
                await browser.close()
                return {
                    "status": "not_available",
                    "message": f"Direct PDF download link not accessible for standard {is_number}. Only preview text is currently available.",
                }

            # Listen for download event
            async with page.expect_download(timeout=25000) as download_info:
                await download_btn.click()
                # If a disclaimer modal appears, click accept/agree
                try:
                    agree_btn = await page.wait_for_selector("input[value*='Accept'], button:has-text('Accept'), button:has-text('I Agree'), button:has-text('Download')", timeout=3000)
                    if agree_btn:
                        await agree_btn.click()
                except Exception:
                    pass

            download = await download_info.value
            await download.save_as(str(target_path))
            logger.info(f"Official Indian Standard PDF saved to: {target_path}")

            await browser.close()

            # Extract text from the downloaded PDF
            extracted_text = extract_pdf_text(target_path)

            return {
                "status": "success",
                "filename": filename,
                "file_path": str(target_path),
                "download_url": f"/api/bis/pdf/{filename}",
                "already_downloaded": False,
                "extracted_text": extracted_text,
            }

        except Exception as exc:
            logger.error(f"Error during PDF download: {exc}")
            await browser.close()
            return {
                "status": "error",
                "message": f"PDF download could not be completed: {str(exc)}",
            }
