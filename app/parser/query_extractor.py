import json
import re
import concurrent.futures
from typing import Dict, Any, List, Optional
from openai import OpenAI
from app.core.config import settings
from app.core.logger import logger
ALLOWED_CATEGORIES = [
    "general",
    "standards",
    "hallmarking",
    "product-certification",
    "fmcs",
    "registration-scheme",
    "laboratory-services",
    "consumer-engagement",
]
SYSTEM_PROMPT = f"""You are a query intent analyzer for the Bureau of Indian Standards (BIS) portal.
Your task is to analyze the user's query and output a strictly valid JSON object with exactly two keys:
1. "keywords": A list of 2 to 4 clean, domain-specific search terms without punctuation.
2. "category": Exactly one of the following canonical categories:
   - "general" (greetings like hi/hello, farewells like bye, gratitude like thanks, bot introduction, capabilities, what can you do, about BIS)
   - "hallmarking" (gold, silver, jewellery, HUID, purity)
   - "product-certification" (ISI mark, Scheme-I, product licenses)
   - "registration-scheme" (Compulsory Registration Scheme / CRS for electronics & IT)
   - "fmcs" (Foreign Manufacturers Certification Scheme)
   - "laboratory-services" (testing labs, calibration, test reports)
   - "consumer-engagement" (consumer complaints, rights, awareness, grievances)
   - "standards" (Indian Standards, IS specifications, formulation)

Output MUST be raw JSON only, with no explanation or extra text.
Example format:
{{"keywords": ["gold", "hallmarking", "purity", "HUID"], "category": "hallmarking"}}
"""
STOPWORDS = {
    "what", "is", "are", "the", "for", "in", "of", "and", "a", "an", "to", "how",
    "do", "i", "can", "get", "need", "about", "tell", "me", "show", "give", "please",
    "information", "details", "process", "requirements", "under", "bis", "india"
}
def detect_conversational_intent(user_prompt: str) -> Optional[str]:
    """
    Detects if the query is a conversational interaction:
    Returns 'greeting', 'farewell', 'gratitude', 'identity', 'capabilities', 'smalltalk',
    or None if it's a domain/regulatory question."""
    if not user_prompt:
        return None
    cleaned = re.sub(r"[^\w\s]", "", user_prompt.lower()).strip()
    words = cleaned.split()
    if not words:
        return None
    greetings = {
        "hi", "hello", "hey", "namaste", "vanakkam", "greetings",
        "good morning", "good afternoon", "good evening", "good day",
        "heya", "howdy", "hii", "hiii", "helloo"
    }
    if cleaned in greetings or (len(words) <= 2 and words[0] in greetings):
        return "greeting"
    farewells = {
        "bye", "goodbye", "good bye", "see you", "see ya", "take care",
        "good night", "have a good day", "have a nice day", "tata", "cya", "farewell"
    }
    if cleaned in farewells or (len(words) <= 3 and any(w in farewells for w in [cleaned, words[0], " ".join(words[:2])])):
        return "farewell"
    gratitude = {
        "thank you", "thanks", "thank you so much", "thanks a lot",
        "many thanks", "dhanyawad", "shukriya", "much appreciated", "appreciate it"
    }
    if cleaned in gratitude or any(g in cleaned for g in ["thank you", "thanks", "dhanyawad", "appreciate"]):
        return "gratitude"
    if any(p in cleaned for p in ["who are you", "what are you", "introduce yourself", "tell me about yourself", "your name", "who made you"]):
        return "identity"
    if any(p in cleaned for p in ["what can you do", "how can you help", "what do you do", "what can i ask", "how does this work", "help me", "help"]):
        if not any(tech in cleaned for tech in ["standard", "license", "hallmark", "certificate", "scheme", "lab", "isi"]):
            return "capabilities"
    if any(p in cleaned for p in ["how are you", "how are you doing", "whats up", "what's up", "how do you do"]):
        return "smalltalk"
    if cleaned in {"what is bis", "about bis", "tell me about bis", "what does bis do", "bis full form"}:
        return "identit"
    return None
def _heuristic_fallback(user_prompt: str) -> Dict[str, Any]:
    """Deterministic rule-based fallback when LLM is unavailable or times out.
    Accurately maps key domain terms to one of the 8 official categories."""
    prompt_lower = user_prompt.lower()
    conv_intent = detect_conversational_intent(user_prompt)
    if conv_intent:
        return {
            "keywords": ["bis", "assistant", conv_intent],
            "category": "general",
            "conversational_intent": conv_intent,
        }
    if any(k in prompt_lower for k in ["standards.bis.gov.in", "know your standard", "indian standard", "is specification", "standard formulation", "draft standard", "divisional council", "sectional committee"]):
        category = "standards"
    elif any(k in prompt_lower for k in ["hallmark", "gold", "silver", "karat", "carat", "jewel", "huid", "assay"]):
        category = "hallmarking"
    elif any(k in prompt_lower for k in ["fmcs", "foreign", "overseas", "abroad", "importer"]):
        category = "fmcs"
    elif any(k in prompt_lower for k in ["crs", "compulsory registration", "electronics", "electronic", "it equipment", "adapter", "battery"]):
        category = "registration-scheme"
    elif any(k in prompt_lower for k in ["lab", "laboratory", "testing", "calibration", "sample", "test report"]):
        category = "laboratory-services"
    elif any(k in prompt_lower for k in ["consumer", "complaint", "grievance", "fraud", "care", "app", "rights"]):
        category = "consumer-engagement"
    elif any(k in prompt_lower for k in ["isi", "isi mark", "product license", "certification scheme", "factory"]):
        category = "product-certification"
    else:
        category = "standards"
    tokens = re.findall(r"[a-zA-Z0-9]+", prompt_lower)
    meaningful = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    if not meaningful:
        keywords = ["bis", category]
    elif len(meaningful) < 2:
        keywords = meaningful + [category]
    else:
        keywords = meaningful[:4]

    return {
        "keywords": keywords,
        "category": category,
        "conversational_intent": None,
    }
def extract_search_intent(user_prompt: str) -> Dict[str, Any]:
    if not user_prompt or not user_prompt.strip():
        return {"keywords": ["bis", "standards"], "category": "general", "conversational_intent": "greeting"}
    conv_intent = detect_conversational_intent(user_prompt)
    if conv_intent:
        logger.info(f"Fast-path conversational intent detected: '{conv_intent}'")
        return {
            "keywords": ["bis", "assistant", conv_intent],
            "category": "general",
            "conversational_intent": conv_intent,
        }
    def _run_llm():
        client = OpenAI(
            base_url=settings.OLLAMA_BASE_URL,
            api_key="ollama",
            timeout=3.0,
        )
        return client.chat.completions.create(
            model=settings.LOCAL_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt.strip()},
            ],
            temperature=0.1,
            max_tokens=150,
        )
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_run_llm)
            response = future.result(timeout=2.5)
        raw_content = response.choices[0].message.content.strip()
        clean_json = re.sub(r"^```json\s*", "", raw_content)
        clean_json = re.sub(r"\s*```$", "", clean_json)
        parsed = json.loads(clean_json)
        keywords = parsed.get("keywords", [])
        category = parsed.get("category", "")
        if not isinstance(keywords, list) or len(keywords) == 0:
            raise ValueError("Invalid keywords format from LLM")
        if category not in ALLOWED_CATEGORIES:
            logger.warning(f"Extracted category '{category}' not in allowed list. Defaulting.")
            return _heuristic_fallback(user_prompt)
        keywords = [str(k).strip() for k in keywords if str(k).strip()][:4]
        logger.info(f"LLM query extraction successful: Category={category}, Keywords={keywords}")
        return {
            "keywords": keywords,
            "category": category,
            "conversational_intent": "general" if category == "general" else None,
        }
    except Exception as exc:
        logger.warning(
            f"Query extraction via local LLM failed or timed out ({type(exc).__name__}: {exc}). "
            "Engaging rule-based heuristic fallback."
        )
        fallback_result = _heuristic_fallback(user_prompt)
        logger.info(f"Fallback intent result: {fallback_result}")
        return fallback_result
