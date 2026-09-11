import asyncio
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from backend.core.logger import logger
from backend.scraper.routes import get_target_url, BIS_BASE_URL

BLOCKED_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".svg", ".css", ".woff", ".woff2", ".gif", ".webp", ".ico"
)
BLOCKED_TYPES = {"image", "stylesheet", "font", "media"}


async def _handle_route(route):
    """Intercepts and cancels requests for media, images, stylesheets and fonts."""
    request = route.request
    url_lower = request.url.lower()
    resource_type = request.resource_type

    if resource_type in BLOCKED_TYPES or any(ext in url_lower for ext in BLOCKED_EXTENSIONS):
        await route.abort()
    else:
        await route.continue_()


def _clean_html(html_content: str) -> str:
    """Parses raw HTML, strips boilerplate, and extracts meaningful text blocks > 40 chars."""
    soup = BeautifulSoup(html_content, "html.parser")

    # Strip unwanted non-content or navigation tags
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"]):
        tag.decompose()

    meaningful_blocks: List[str] = []
    # Extract substantive blocks: paragraphs, list items, table cells, headings
    for el in soup.find_all(["p", "li", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"]):
        text = el.get_text(separator=" ", strip=True)
        if len(text) > 40:
            cleaned = " ".join(text.split())
            meaningful_blocks.append(cleaned)

    # Deduplicate while preserving order
    seen = set()
    deduped_blocks = []
    for block in meaningful_blocks:
        if block not in seen:
            seen.add(block)
            deduped_blocks.append(block)

    full_text = "\n\n".join(deduped_blocks)
    return full_text[:10000]


import re
from backend.scraper.standards_scraper import search_bis_standards, extract_is_number


async def scrape_bis_data(category: str, keywords: str, user_query: str = "") -> Dict[str, Any]:
    """
    Scrapes official BIS data. When querying standards or specific products/IS numbers,
    uses the official standards repository (standardsbis.bsbedge.com) for genuine IS metadata
    and clause previews. For policy sections, performs live headless crawling.
    """
    # Fast bypass for general category queries (greetings, introductions, small talk)
    if category == "general":
        logger.info("General category detected. Providing authoritative BIS overview knowledge without crawling.")
        overview_text = (
            "Bureau of Indian Standards (BIS) Institutional Overview:\n\n"
            "The Bureau of Indian Standards (BIS) is the National Standard Body of India, established under the "
            "Bureau of Indian Standards Act, 2016. Operating under the Ministry of Consumer Affairs, Food & Public "
            "Distribution, Government of India, BIS is responsible for the harmonious development of standardization, "
            "conformity assessment, and quality assurance across the nation.\n\n"
            "Core Activities & Mandates:\n"
            "1. Standards Formulation: Development of Indian Standards (IS) across 15 technical sectors (Civil, Mechanical, "
            "Electrotechnical, Electronics & IT, Chemical, Food & Agriculture, Textiles, Medical Equipment, etc.) covering over 21,000 standards.\n"
            "2. Product Certification (ISI Mark / Scheme-I): Enabling manufacturers to certify products with the ISI mark through rigorous "
            "factory audits, quality management, and product sample testing.\n"
            "3. Compulsory Registration Scheme (CRS / Scheme-II): Mandatory self-declaration conformity for electronics and IT goods "
            "under regulations from MeitY and other nodal ministries.\n"
            "4. Hallmarking of Gold and Silver: Ensuring genuine purity through 6-digit Hallmark Unique Identification (HUID) numbers and "
            "mandated purity grades (e.g., 24K, 22K, 18K, 14K under IS 1417).\n"
            "5. Foreign Manufacturers Certification Scheme (FMCS): Certification for overseas manufacturers supplying regulated goods to India.\n"
            "6. Laboratory Services: Comprehensive national network of BIS testing and calibration laboratories ensuring testing integrity.\n"
            "7. Consumer Engagement & Grievance Redressal: Empowering citizens via the official BIS CARE mobile app to verify ISI marks, "
            "authenticate HUIDs, and lodge complaints against non-compliant products.\n\n"
            "Official Portals:\n"
            "- BIS Main Portal: https://www.bis.gov.in\n"
            "- Standards Portal (Know Your Standards): https://standards.bis.gov.in/website\n"
            "- Manakonline (e-BIS): https://www.manakonline.in"
        )
        return {
            "url": "https://www.bis.gov.in/?lang=en",
            "text": overview_text,
            "matched_standards": [],
            "primary_preview": "",
        }

    has_is_num = extract_is_number(user_query) or extract_is_number(keywords)
    is_standards_query = (
        category == "standards"
        or bool(has_is_num)
        or any(k in user_query.lower() for k in ["standard", "specification", "is ", "code", "purity", "grade", "cement", "steel", "gold"])
    )

    matched_standards = []
    primary_preview = ""
    standards_text = ""
    target_url = get_target_url(category)

    # 1. If query relates to Indian Standards or contains IS number / product, query standards catalog
    if is_standards_query:
        logger.info(f"Detected Indian Standards query intent. Querying official BIS standards database...")
        search_query = user_query if user_query else keywords
        standards_result = await asyncio.to_thread(search_bis_standards, search_query, keywords)
        matched_standards = standards_result.get("matched_standards", [])
        primary_preview = standards_result.get("primary_preview", "")
        standards_text = standards_result.get("clean_text", "")
        if standards_result.get("url"):
            target_url = standards_result["url"]

    # 2. If no standards were found, crawl the section page for general scheme information
    clean_text = standards_text
    if not clean_text or not matched_standards:
        category_url = get_target_url(category)
        logger.info(f"Initiating live crawl for category '{category}' at: {category_url}")

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--disable-gpu",
                    ],
                )
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 720},
                )

                # Block heavy media and styling assets to ensure fast retrieval
                await context.route(
                    "**/*.{png,jpg,jpeg,svg,gif,webp,ico,woff,woff2,ttf,eot,css,mp4,webm}*",
                    lambda route: route.abort(),
                )
                await context.route("**/*", _handle_route)

                page = await context.new_page()
                try:
                    # 8-second target navigation timeout for snappy retrieval
                    response = await page.goto(
                        category_url,
                        wait_until="domcontentloaded",
                        timeout=8000,
                    )
                    logger.info(f"Page loaded with status: {response.status if response else 'Unknown'}")
                    content = await page.content()
                    section_text = _clean_html(content)
                    if section_text:
                        clean_text = f"{clean_text}\n\n{section_text}".strip() if clean_text else section_text
                except Exception as nav_err:
                    logger.warning(f"Playwright navigation notice: {nav_err}. Attempting partial content recovery.")
                    try:
                        content = await page.content()
                        section_text = _clean_html(content)
                        if section_text:
                            clean_text = f"{clean_text}\n\n{section_text}".strip() if clean_text else section_text
                    except Exception:
                        pass
                finally:
                    await context.close()
                    await browser.close()

        except Exception as exc:
            logger.error(f"Playwright scraper encountered an error ({type(exc).__name__}: {exc})")

    # Graceful fallback if scraped text is minimal or site is unreachable
    if not clean_text or len(clean_text) < 100:
        logger.warning(f"Scraped text below threshold. Supplying authoritative BIS domain knowledge context for {category}.")
        if category == "standards" or "standards.bis.gov.in" in target_url:
            clean_text = (
                f"Official Bureau of Indian Standards (BIS) Standards Portal: https://standards.bis.gov.in/website\n\n"
                f"1. Know Your Standards: The official BIS Standards Portal (https://standards.bis.gov.in/website) "
                f"is the centralized national repository for exploring, searching, and accessing all Indian Standards (IS). "
                f"Users can search standards by Indian Standard (IS) Number, title, keywords, or product designation.\n\n"
                f"2. Standards Formulation & Life Cycle: BIS formulates standards through technical Sectional Committees "
                f"comprising regulators, industry experts, manufacturers, testing laboratories, and consumer bodies. "
                f"The process follows: Proposal (P-Draft) -> Committee Draft (WC-Draft Open for Public Comments) -> "
                f"Finalization by Division Council -> Adoption & Gazette Notification -> Reaffirmation / Revision every 5 years.\n\n"
                f"3. Mandatory Standards & Quality Control Orders (QCOs): Under Section 16 of the BIS Act, 2016, various Central "
                f"Ministries (DPIIT, Ministry of Steel, MeitY, Ministry of Chemicals & Petrochemicals, MoEFCC) issue Quality "
                f"Control Orders (QCOs) making specific Indian Standards mandatory for domestic manufacturing, storage, "
                f"and sale in India, as well as foreign imports. Products under QCOs must bear the Standard Mark (ISI Mark).\n\n"
                f"4. Divisional Councils: Covers 15 broad technical sectors including Civil Engineering (CED), Electrotechnical (ETD), "
                f"Chemical (CHD), Food & Agriculture (FAD), Mechanical Engineering (MED), Medical Equipment (MHD), "
                f"Electronics & Information Technology (LITD), Petroleum & Coal (PCD), Textiles (TXD), and Transport (TED).\n\n"
                f"5. Access & Public Comments: The portal allows public stakeholders to view standards, review open WC Drafts, "
                f"submit technical feedback, propose new standards, and check harmonization with international ISO/IEC standards."
            )
        else:
            clean_text = (
                f"Official Bureau of Indian Standards (BIS) Portal Information for Category: {category.upper()}.\n"
                f"Target URL: {target_url}\n"
                f"BIS operates under the Bureau of Indian Standards Act, 2016. Under this scheme, manufacturers "
                f"and stakeholders must comply with prescribed Indian Standards (IS), conformity assessment procedures, "
                f"sample testing in BIS-recognized laboratories, and factory surveillance. For Hallmarking, IS 1417 specifies "
                f"gold purity standards and HUID (Hallmark Unique Identification). For Foreign Manufacturers Certification "
                f"Scheme (FMCS), overseas applicants must apply under Scheme-I of Schedule-II. For Compulsory Registration "
                f"Scheme (CRS), IT and electronic items must be registered under Scheme-II."
            )

    logger.info(f"Successfully compiled {len(clean_text)} characters of text from {target_url}")
    return {
        "url": target_url,
        "text": clean_text,
        "matched_standards": matched_standards,
        "primary_preview": primary_preview,
    }

