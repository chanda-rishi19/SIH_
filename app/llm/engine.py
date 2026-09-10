import concurrent.futures
from typing import Dict, Any
from app.core.config import settings
from app.core.logger import logger
from app.llm.prompts import BIS_SYSTEM_PROMPT, format_user_prompt
from app.llm.local import query_local_llm
from app.llm.gemini import query_gemini
def _generate_conversational_fallback(query: str, intent_type: str, source_url: str) -> str:
    """Provides high-quality, domain-aware responses for conversational queries when LLMs are offline."""
    intent = (intent_type or "").lower()

    if intent == "greeting":
        return (
            "Welcome to the Bureau of Indian Standards (BIS) AI Assistant! \n\n"
            "Hello! I am your official **BIS AI Technical Assistant**. I am here to assist Indian citizens, "
            "manufacturers, importers, and consumers with authoritative guidance on Indian Standards and regulatory compliance.\n\n"
            "-->Key areas I can assist you with:\n"
            "-Indian Standards (IS) Search**: Find standard specifications, amendments, and clause previews across 21,000+ standards (e.g., *IS 1417* for Gold, *IS 269* for Cement, *IS 14543* for Packaged Water).\n"
            "-Product Certification (ISI Mark)**: Scheme-I application processes, factory audit checklists, and testing protocols.\n"
            "-Compulsory Registration Scheme (CRS)**: Electronics & IT equipment compliance under Scheme-II.\n"
            "-Gold & Silver Hallmarking**: Purity grades, 6-digit HUID verification, and jeweler registration rules.\n"
            "-Foreign Manufacturers Certification Scheme (FMCS)**: Licensing requirements for overseas factories exporting to India.\n"
            "-Testing & Calibration Labs**: Find BIS-recognized laboratories and conformity assessment rules.\n"
            "-Consumer Grievance & BIS CARE**: Guidance on verifying authenticity and filing complaints.\n\n"
            "*How may I assist you today? You can type any product, standard number, or compliance question!"
        )

    if intent in ("identity", "capabilities"):
        return (
            "Bureau of Indian Standards (BIS) AI Technical Assistant\n\n"
            "I am the Bureau of Indian Standards (BIS) AI Technical Assistant**, an automated regulatory intelligence guide. "
            "BIS is the National Standards Body of India established under the [Bureau of Indian Standards Act, 2016], "
            "operating under the Ministry of Consumer Affairs, Food & Public Distribution.\n\n"
            " What I Can Do For You:\n"
            "1.Search 21,000+ Indian Standards (IS)**: Instantly lookup specifications, active status, scope, and technical committee details.\n"
            "2.Official Standard Previews & PDF Downloads**: View Clause 1 scope and download official standards via your BIS portal account.\n"
            "3.ISI Mark (Scheme-I) Guidance**: Step-by-step procedures for domestic manufacturers to obtain an ISI certification license.\n"
            "4.CRS (Scheme-II) Electronics Registration**: Check if your electronics, adapters, or batteries require mandatory BIS CRS registration.\n"
            "5.Gold & Silver Hallmarking (HUID)**: Understand hallmarking mandates, 14K/18K/22K/24K purity standards, and HUID verification.\n"
            "6.FMCS Overseas Certification**: Comprehensive guidance for foreign entities seeking Indian market entry.\n"
            "7.Consumer Awareness & BIS CARE**: Direct links and guidance on validating products and resolving grievances.\n\n"
            " Sample Questions You Can Ask:\n"
            "-\"What are the purity grades and hallmarking rules under IS 1417?\"\n"
            "-\"What is the specification for Ordinary Portland Cement under IS 269?\"\n"
            "-\"What is the process to get an ISI Mark for packaged drinking water?\"\n"
            "-\"Which electronic items require Compulsory Registration Scheme (CRS)?\""
        )

    if intent == "farewell":
        return (
            "Thank You for Visiting BIS! 👋\n\n"
            "Thank you for consulting the **Bureau of Indian Standards (BIS) AI Technical Assistant.\n\n"
            "BIS remains committed to safeguarding consumer health, safety, and quality across India."
            "Whenever you need assistance with Indian Standards, ISI mark verification, hallmarking, or regulatory compliance, "
            "I will be here to help.\n\n"
            "Official Portals & Resources:\n"
            "- Main BIS Portal: [www.bis.gov.in](https://www.bis.gov.in)\n"
            "- Standards Database: [standards.bis.gov.in](https://standards.bis.gov.in/website)\n"
            "- Consumer App: **BIS CARE** (Android & iOS)\n\n"
            "Have a safe, productive, and wonderful day!"
        )

    if intent == "gratitude":
        return (
            "You're Very Welcome! \n\n"
            "I am glad I could help! Ensuring quality, safety, and transparency under the Bureau of Indian Standards (BIS) "
            "framework is our foremost priority.\n\n"
            "If you have more questions about Indian Standards (IS), laboratory testing, gold hallmarking, or certification schemes, "
            "please feel free to ask anytime!"
        )

    if intent == "smalltalk":
        return (
            "Hello!\n\n"
            "I am doing very well, thank you! As the **BIS AI Technical Assistant, I am fully primed to help you search Indian Standards, "
            "understand ISI Mark certification, verify gold hallmarking, or explore regulatory guidelines.\n\n"
            "What standard or product would you like to explore today?"
        )

    # General fallback
    return (
        "Bureau of Indian Standards (BIS) Assistant\n\n"
        f"Thank you for reaching out regarding: {query}.\n\n"
        "I am here to assist you with Indian Standards, product certifications, and compliance procedures. "
        f"You can explore comprehensive national standards and guidelines at [{source_url}]({source_url}).\n\n"
        "Feel free to ask specific questions such as standard numbers (e.g., IS 1417, IS 269) or certification schemes (ISI, CRS, FMCS, Hallmarking)!"
    )


def generate_answer(
    query: str,
    retrieved_context: str,
    source_url: str,
    is_general: bool = False,
    intent_type: str = "",
) -> Dict[str, Any]:
    """Dual-engine orchestration with circuit breaker pattern:
    1. Attempts answer synthesis using Local Ollama (settings.LOCAL_MODEL).
    2. On connection error, timeout (>12s), or exception, trips circuit breaker
       and immediately fails over to Google AI Studio (settings.GEMINI_MODEL).
    3. If both engines fail or time out, provides authoritative resilient fallback.
    4. Returns standardized payload: {"answer": str, "engine": str, "source_url": str}."""
    prompt = format_user_prompt(
        query=query,
        retrieved_context=retrieved_context,
        source_url=source_url,
        is_general=is_general,
        intent_type=intent_type,
    )
    effective_local_timeout = 8.0 if is_general else settings.LOCAL_TIMEOUT
    try:
        logger.info(f"Attempting primary generation via Local Ollama engine (wall-clock timeout: {effective_local_timeout}s)...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(query_local_llm, prompt, BIS_SYSTEM_PROMPT)
            answer = future.result(timeout=effective_local_timeout)
            return {
                "answer": answer,
                "engine": f"Local Ollama ({settings.LOCAL_MODEL})",
                "source_url": source_url,
            }
    except concurrent.futures.TimeoutError:
        logger.warning(
        f"Circuit Breaker Triggered: Local LLM exceeded hard wall-clock timeout ({effective_local_timeout}s). "
         f"Failing over to Google AI Studio ({settings.GEMINI_MODEL})..."
        )
    except Exception as local_err:
        logger.warning(
         f"Circuit Breaker Triggered: Local LLM failed ({type(local_err).__name__}: {local_err}). "
          f"Failing over to Google AI Studio ({settings.GEMINI_MODEL})..."
        )
    try:
        logger.info(f"Attempting fallback generation via Google AI Studio ({settings.GEMINI_MODEL})...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(query_gemini, prompt, BIS_SYSTEM_PROMPT)
            answer = future.result(timeout=10.0)
            return {
            "answer":answer,
             "engine":f"Gemini Fallback({settings.GEMINI_MODEL})",
            "source_url":source_url,
            }
    except Exception as gemini_err:
        logger.error(
        f"Dual-engine failure: Both Ollama and Gemini failed ({type(gemini_err).__name__}: {gemini_err}). "
         "Engaging resilient fallback synthesis."
        )
    if is_general or intent_type:
        resilient_answer = _generate_conversational_fallback(query, intent_type, source_url)
        return {
        "answer":resilient_answer,
         "engine":"BIS Assistant Knowledge",
         "source_url":source_url,
        }
    bullet_points = "\n".join(
    [f"- {line.strip()}" for line in retrieved_context.split("\n\n---\n\n") if line.strip()][:3]
    )
    resilient_answer = (
    f"Bureau of Indian Standards (BIS) Information Summary\n\n"
     f"Query: {query}\n\n"
     f"Official Source: [{source_url}]({source_url})\n\n"
     f"Key Retrieved Excerpts & Standards Guidelines:\n"
     f"{bullet_points or '- Please refer to the official portal link for complete requirements.'}\n\n"
      f"> Notice: Both Local Ollama and Gemini API were temporarily unreachable. "
      f"The excerpts above were extracted live from the official BIS portal. "
     f"Please verify license requirements and applicable Indian Standards directly at {source_url}."
    )
    return {
    "answer": resilient_answer,
     "engine": "Emergency Context Synthesis (Offline Fallback)",
    "source_url": source_url,
    }
