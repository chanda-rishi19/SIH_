import re
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
from app.core.logger import logger

BIS_PORTAL_BASE = "https://standardsbis.bsbedge.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def extract_is_number(query: str) -> Optional[str]:
    """Extracts candidate IS number from query (e.g. 'IS 1417', 'IS1417', '1417')."""
    # Matches 'IS 1417', 'IS-1417', or standalone 3 to 5 digit numbers
    match = re.search(r'\b(?:IS\s*[-:]?\s*)?([1-9]\d{2,5})\b', query, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def fetch_url(url: str, timeout: int = 10) -> Optional[str]:
    """Fetches HTML content from URL with standard headers."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        logger.warning(f"Failed to fetch {url}: {exc}")
        return None


def fetch_standard_preview(preview_id: str) -> str:
    """
    Fetches the authoritative standard preview from BIS_Preview.aspx?id={preview_id}.
    Contains Clause 1 (Scope), Clause 2 (References), ICS, Technical Committee, and specifications.
    """
    if not preview_id:
        return ""
    preview_url = f"{BIS_PORTAL_BASE}/BIS_Preview.aspx?id={preview_id}"
    logger.info(f"Fetching official standard preview from: {preview_url}")
    html = fetch_url(preview_url, timeout=8)
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")
    # Remove script and style tags
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    # Clean redundant blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned_preview = "\n".join(lines)
    return cleaned_preview[:5000]


def parse_search_results(html_content: str, source_url: str) -> List[Dict[str, Any]]:
    """Parses standard cards from BIS search result page HTML."""
    soup = BeautifulSoup(html_content, "html.parser")
    results = []

    # Cards are structured in divs with class 'div_abc_main'
    cards = soup.find_all("div", class_="div_abc_main")
    for card in cards:
        try:
            # 1. Standard Number
            std_no_el = card.find(id=re.compile(r"lblstdno_rptr"))
            std_no = std_no_el.get_text(strip=True) if std_no_el else ""

            # 2. Standard Title & Technical Committee in div-abc1
            div_abc1 = card.find("div", class_="div-abc1")
            title = ""
            tech_committee = ""
            if div_abc1:
                # Title is specifically in span with font-size: 15px or non-reaffirmed span
                title_span = div_abc1.find("span", style=re.compile(r"font-size:\s*15px", re.I))
                if title_span:
                    title = title_span.get_text(strip=True)
                else:
                    # Fallback: find span that is not reaffirmation or standard number
                    for s in div_abc1.find_all("span"):
                        s_id = s.get("id", "")
                        text = s.get_text(strip=True)
                        if "reaff" in s_id or "lblstdno" in s_id or "Technical Committee" in text or "Superseeded" in text:
                            continue
                        if len(text) > 8 and not text.startswith("("):
                            title = text
                            break

                # Technical committee extraction
                tc_label = div_abc1.find("span", string=re.compile(r"Technical Committee", re.I))
                if tc_label and tc_label.next_sibling:
                    tech_raw = str(tc_label.next_sibling).strip()
                    # Clean any trailing divs or superseeded tags
                    tech_committee = tech_raw.splitlines()[0].strip()
                if not tech_committee:
                    m = re.search(r"Technical Committee\s*:\s*([A-Za-z0-9\s/]+)", div_abc1.get_text())
                    if m:
                        tech_committee = m.group(1).split("Superseeded")[0].strip()

            # 3. Status and Amendments in div-abc2
            status = "Active"
            amendments = 0
            div_abc2 = card.find("div", class_="div-abc2")
            if div_abc2:
                status_el = div_abc2.find(id=re.compile(r"lblstatus"))
                if status_el:
                    status = status_el.get_text(strip=True)

                amds_el = div_abc2.find(id=re.compile(r"noanmds"))
                if amds_el:
                    try:
                        amendments = int(re.sub(r"\D", "", amds_el.get_text(strip=True)) or "0")
                    except ValueError:
                        amendments = 0

            # 4. Preview Link in div-abc
            preview_id = ""
            preview_link = card.find("a", href=re.compile(r"BIS_Preview\.aspx\?id="))
            if preview_link and preview_link.get("href"):
                m = re.search(r"id=([A-Za-z0-9_-]+)", preview_link["href"])
                if m:
                    preview_id = m.group(1)

            if std_no or title:
                results.append({
                    "is_number": std_no,
                    "title": title,
                    "status": status,
                    "technical_committee": tech_committee,
                    "amendments": amendments,
                    "preview_id": preview_id,
                    "preview_url": f"{BIS_PORTAL_BASE}/BIS_Preview.aspx?id={preview_id}" if preview_id else "",
                    "source_url": source_url,
                })
        except Exception as err:
            logger.debug(f"Error parsing search result card: {err}")
            continue

    return results



def search_bis_standards(query: str, keywords: str = "") -> Dict[str, Any]:
    """
    Searches official Indian Standards on standardsbis.bsbedge.com.
    Prioritizes IS Number lookup, then falls back to title/keyword search.
    Retrieves full Clause 1/Scope preview for top match.
    """
    is_num = extract_is_number(query) or extract_is_number(keywords)
    search_url = ""
    html = ""
    search_mode = ""

    # Strategy A: IS Number direct search (prefixed with 'IS ' for exact standard number match)
    if is_num:
        search_mode = f"IS Number (IS {is_num})"
        search_url = f"{BIS_PORTAL_BASE}/BIS_SearchStandard.aspx?Standard_Number={urllib.parse.quote('IS ' + is_num)}&id=0"
        logger.info(f"Querying BIS standards portal by {search_mode} at: {search_url}")
        html = fetch_url(search_url)


    # Strategy B: Keyword / Title search if no IS number or no results
    if not html or (html and "No Records Found" in html):
        search_term = keywords.strip() or query.strip()
        # Clean query: strip stopwords
        clean_terms = [w for w in re.findall(r'[a-zA-Z0-9]+', search_term) if len(w) > 2 and w.lower() not in {"what", "the", "for", "under", "standard", "bis", "indian", "specification"}]
        kw = " ".join(clean_terms[:3]) or search_term
        search_mode = f"Keyword ('{kw}')"
        search_url = f"{BIS_PORTAL_BASE}/BIS_SearchStandard.aspx?keyword={urllib.parse.quote(kw)}&id=0"
        logger.info(f"Querying BIS standards portal by {search_mode} at: {search_url}")
        html = fetch_url(search_url)

    if not html:
        return {
            "matched_standards": [],
            "primary_preview": "",
            "clean_text": "",
            "url": search_url or f"{BIS_PORTAL_BASE}/",
        }

    standards = parse_search_results(html, search_url)
    logger.info(f"Parsed {len(standards)} Indian Standards from {search_url}")

    if is_num:
        # Prioritize exact match e.g. "IS 1417 :" before "IS 11417 :"
        standards.sort(key=lambda s: 0 if re.search(rf"\bIS\s*{is_num}\b", s.get("is_number", "")) else 1)

    # Fetch official preview for the top matching standard
    primary_preview = ""
    if standards:
        top_std = standards[0]
        if top_std.get("preview_id"):
            primary_preview = fetch_standard_preview(top_std["preview_id"])


    # Compile structured, rich text for RAG indexing
    text_blocks = []
    text_blocks.append(f"Official Bureau of Indian Standards (BIS) Standards Database Search.")
    text_blocks.append(f"Search Target: {search_url} | Mode: {search_mode}\n")

    if standards:
        text_blocks.append("Matching Indian Standards (IS) Found in Official BIS Catalog:")
        for idx, s in enumerate(standards[:6], 1):
            text_blocks.append(
                f"{idx}. {s['is_number']} - {s['title']} | Status: {s['status']} | "
                f"Technical Committee: {s['technical_committee'] or 'N/A'} | Amendments: {s['amendments']}"
            )
            if s.get("preview_url"):
                text_blocks.append(f"   Official Preview URL: {s['preview_url']}")

        if primary_preview:
            text_blocks.append(f"\n--- Authoritative Standard Clauses & Scope Preview ({top_std['is_number']}) ---")
            text_blocks.append(primary_preview)
    else:
        text_blocks.append("No direct Indian Standard records found for the specific query term.")

    full_text = "\n\n".join(text_blocks)

    return {
        "matched_standards": standards,
        "primary_preview": primary_preview,
        "clean_text": full_text[:10000],
        "url": search_url,
    }
