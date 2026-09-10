from google import genai
from google.genai import types
from app.core.config import settings
from app.core.logger import logger


def query_gemini(prompt: str, system_prompt: str) -> str:
    """
    Executes answer generation via Google AI Studio using the modern google-genai SDK.
    Uses settings.GEMINI_MODEL (defaults to gemini-2.5-flash).
    """
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured in environment or .env file. "
            "Please provide a valid Google AI Studio API key."
        )

    logger.info(f"Querying Google AI Studio ({settings.GEMINI_MODEL}) as fallback engine...")

    client = genai.Client(api_key=api_key)

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.2,
        max_output_tokens=1500,
    )

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=config,
    )

    answer = response.text
    if not answer or not answer.strip():
        raise ValueError("Gemini API returned an empty response.")

    logger.info(f"Gemini API ({settings.GEMINI_MODEL}) generated response successfully.")
    return answer.strip()
