"""Dual-engine LLM module with automatic circuit breaker fallback."""
from app.llm.engine import generate_answer

__all__ = ["generate_answer"]
