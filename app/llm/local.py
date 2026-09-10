from openai import OpenAI
from app.core.config import settings
from app.core.logger import logger


def query_local_llm(prompt: str, system_prompt: str) -> str:
    """
    Executes answer generation via local Ollama instance using the OpenAI-compatible SDK.
    Enforces a strict timeout specified in settings.LOCAL_TIMEOUT.
    """
    logger.info(
        f"Querying local LLM ({settings.LOCAL_MODEL}) via {settings.OLLAMA_BASE_URL} (timeout={settings.LOCAL_TIMEOUT}s)..."
    )

    client = OpenAI(
        base_url=settings.OLLAMA_BASE_URL,
        api_key="ollama",
        timeout=settings.LOCAL_TIMEOUT,
    )

    response = client.chat.completions.create(
        model=settings.LOCAL_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=500,
        timeout=settings.LOCAL_TIMEOUT,
    )

    answer = response.choices[0].message.content
    if not answer or not answer.strip():
        raise ValueError("Local LLM returned empty response content.")

    logger.info(f"Local LLM ({settings.LOCAL_MODEL}) successfully generated response.")
    return answer.strip()
