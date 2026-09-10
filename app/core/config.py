import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Resolve base project directory and load .env if available
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_file_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_file_path)


class Settings(BaseSettings):
    """Application settings with environment variable fallbacks."""
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    LOCAL_MODEL: str = os.getenv("LOCAL_MODEL", "llama3.2")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    LOCAL_TIMEOUT: float = float(os.getenv("LOCAL_TIMEOUT", "12.0"))

    # BIS Portal Authentication & Downloads
    BIS_USERNAME: str = os.getenv("BIS_USERNAME", "")
    BIS_PASSWORD: str = os.getenv("BIS_PASSWORD", "")
    DOWNLOADS_DIR: Path = BASE_DIR / "downloads"
    SESSION_FILE: Path = BASE_DIR / "bis_session.json"

    class Config:
        env_file = ".env"
        extra = "ignore"


# Expose singleton instance
settings = Settings()
settings.DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

