from openai import OpenAI
from backend.core.config import settings
from backend.core.logger import logger


def query_local_llm(prompt: str, system_prompt: str, timeout: float = None, max_tokens: int = None) -> str:
    """
    Executes answer generation via local Ollama instance using the OpenAI-compatible SDK.
    Enforces a strict timeout specified in timeout or settings.LOCAL_TIMEOUT.
    """
    effective_timeout = timeout or settings.LOCAL_TIMEOUT
    effective_max_tokens = max_tokens or 1000

    logger.info(
        f"Querying local LLM ({settings.LOCAL_MODEL}) via {settings.OLLAMA_BASE_URL} (timeout={effective_timeout}s, max_tokens={effective_max_tokens})..."
    )

    client = OpenAI(
        base_url=settings.OLLAMA_BASE_URL,
        api_key="ollama",
        timeout=effective_timeout,
    )

    response = client.chat.completions.create(
        model=settings.LOCAL_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=effective_max_tokens,
        timeout=effective_timeout,
    )

    answer = response.choices[0].message.content
    if not answer or not answer.strip():
        raise ValueError("Local LLM returned empty response content.")

    logger.info(f"Local LLM ({settings.LOCAL_MODEL}) successfully generated response.")
    return answer.strip()
