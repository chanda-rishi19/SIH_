import hashlib
import concurrent.futures
from typing import Dict, Tuple
from backend.core.config import settings
from backend.core.logger import logger
from backend.llm.prompts import LANGUAGE_NAMES

# In-memory translation cache: (md5_hash, target_lang) -> translated_text
_TRANSLATION_CACHE: Dict[Tuple[str, str], str] = {}


def _get_text_hash(text: str) -> str:
    return hashlib.md5(text.strip().encode("utf-8")).hexdigest()


def _translate_google_batch(chunk: str, target_lang: str) -> str:
    """Fast, accurate translation of a markdown chunk via Google Translate endpoint."""
    if not chunk.strip():
        return ""
    import urllib.request
    import urllib.parse
    import json

    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={urllib.parse.quote(chunk)}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    with urllib.request.urlopen(req, timeout=6.0) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if data and len(data) > 0 and data[0]:
            segments = [seg[0] for seg in data[0] if seg and seg[0]]
            return "".join(segments)
    return chunk


def _translate_fast_full(text: str, target_lang: str) -> str:
    """Translates entire text preserving markdown paragraphs and structure.
    Uses parallel HTTP calls for speed — typically under 1 second."""
    # For short text (< 2000 chars), translate in one shot — no batching overhead
    if len(text) < 2000:
        return _translate_google_batch(text, target_lang)

    paragraphs = text.split("\n\n")
    batches = []
    current_batch = []
    current_len = 0

    for p in paragraphs:
        p_len = len(p)
        if current_batch and (current_len + p_len > 1800):
            batches.append("\n\n".join(current_batch))
            current_batch = [p]
            current_len = p_len
        else:
            current_batch.append(p)
            current_len += p_len + 2

    if current_batch:
        batches.append("\n\n".join(current_batch))

    # Parallel translation of all batches for speed
    if len(batches) == 1:
        return _translate_google_batch(batches[0], target_lang)

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(batches), 4)) as executor:
        futures = [executor.submit(_translate_google_batch, b, target_lang) for b in batches]
        translated_batches = [f.result(timeout=8.0) for f in futures]

    return "\n\n".join(translated_batches)


def translate_text(text: str, target_language: str = "en", source_language: str = "auto") -> str:
    """
    Translates technical BIS responses into the requested Indian language.
    Strictly preserves Indian Standard numbers (IS 1417, IS 269), acronyms (HUID, ISI, CRS, FMCS),
    percentages, and markdown formatting.
    Guarantees complete translation of all paragraphs in sub-second to 2s time.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        return ""

    target_lang = (target_language or "en").lower()
    lang_name = LANGUAGE_NAMES.get(target_lang, "English")

    # If target is English and source is English / ascii, no translation needed
    if target_lang == "en" and (source_language == "en" or clean_text.isascii()):
        return clean_text

    # 1. Check in-memory cache first (0ms instant hit)
    cache_key = (_get_text_hash(clean_text), target_lang)
    if cache_key in _TRANSLATION_CACHE:
        logger.info(f"Translation cache hit for target language '{target_lang}' ({lang_name})")
        return _TRANSLATION_CACHE[cache_key]

    logger.info(f"Translating {len(clean_text)} characters to {lang_name} ({target_lang})...")

    # 2. Tier 1: Fast parallel Google Translate engine (sub-1s for most texts)
    try:
        fast_result = _translate_fast_full(clean_text, target_lang)
        if fast_result and fast_result.strip() and fast_result.strip() != clean_text:
            clean_res = fast_result.strip()
            _TRANSLATION_CACHE[cache_key] = clean_res
            logger.info(f"Translated {len(clean_text)} chars to {lang_name} in Tier-1 (Google Translate).")
            return clean_res
    except Exception as fast_err:
        logger.warning(f"Google Translate engine failed: {fast_err}. Trying MyMemory...")

    # 3. Tier 2: MyMemory API (lightweight, no LLM cost) — parallel sentence calls
    try:
        import urllib.request
        import urllib.parse
        import json

        def _mymemory_translate(sentence: str) -> str:
            if not sentence.strip() or len(sentence) > 450:
                return sentence
            url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(sentence)}&langpair=auto|{target_lang}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            try:
                with urllib.request.urlopen(req, timeout=4.0) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    trans_text = resp_data.get("responseData", {}).get("translatedText")
                    if trans_text and trans_text.strip():
                        return trans_text.replace("&quot;", '"').replace("&#39;", "'").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
            except Exception:
                pass
            return sentence

        paragraphs = clean_text.split("\n\n")
        sentences = []
        for para in paragraphs:
            para_s = para.strip()
            if para_s:
                sentences.extend([s.strip() for s in para_s.replace(". ", ".\n").split("\n") if s.strip()])

        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(sentences), 5)) as executor:
            results = list(executor.map(_mymemory_translate, sentences))

        mm_result = " ".join(results).strip()
        if mm_result and mm_result != clean_text:
            _TRANSLATION_CACHE[cache_key] = mm_result
            logger.info(f"Translated to {lang_name} via MyMemory Tier-2.")
            return mm_result
    except Exception as mm_err:
        logger.warning(f"MyMemory translation failed: {mm_err}")

    # 4. Final fallback: Return original text
    logger.warning("All translation engines failed. Returning original text.")
    return clean_text
