import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import handle_query, QueryRequest
from backend.parser.query_extractor import detect_conversational_intent

async def test_multilingual():
    print("=== 1. Testing Indic Conversational Intent Detection ===")
    test_phrases = [
        ("नमस्ते", "greeting"),
        ("வணக்கம்", "greeting"),
        ("నమస్కారం", "greeting"),
        ("धन्यवाद", "gratitude"),
        ("நன்றி", "gratitude"),
        ("अलविदा", "farewell"),
        ("बीआईएस क्या है", "identity"),
    ]
    for phrase, expected in test_phrases:
        detected = detect_conversational_intent(phrase)
        print(f"Phrase: '{phrase}' -> Detected: '{detected}' (Expected: '{expected}')")
        assert detected == expected, f"Failed detection for '{phrase}': got '{detected}' != '{expected}'"

    print("\n=== 2. Testing Hindi Greeting End-to-End ===")
    req_hi_greeting = QueryRequest(query="नमस्ते", language="hi")
    res_hi_greeting = await handle_query(req_hi_greeting)
    print(f"Greeting Engine: {res_hi_greeting.engine}")
    print(f"Greeting Answer Preview:\n{res_hi_greeting.answer[:250]}...\n")
    assert "भारतीय मानक ब्यूरो" in res_hi_greeting.answer or "नमस्ते" in res_hi_greeting.answer or "BIS" in res_hi_greeting.answer

    print("=== 3. Testing Technical Query with Hindi Localization ===")
    req_hi_tech = QueryRequest(
        query="What are the purity grades and hallmarking rules under IS 1417?",
        language="hi"
    )
    res_hi_tech = await handle_query(req_hi_tech)
    print(f"Tech Query Engine: {res_hi_tech.engine}")
    print(f"Tech Query Answer Preview:\n{res_hi_tech.answer[:300]}...\n")
    assert res_hi_tech.answer, "Answer must not be empty"

    print("ALL MULTILINGUAL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_multilingual())
