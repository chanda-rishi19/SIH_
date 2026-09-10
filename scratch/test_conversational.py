import asyncio
import time
from app.main import handle_query, QueryRequest

async def test():
    test_queries = [
        ("Greeting", "hi"),
        ("Introduction", "who are you?"),
        ("Capabilities", "what can you do?"),
        ("Farewell", "bye"),
        ("Gratitude", "thank you"),
        ("Technical (IS 1417)", "What are the purity grades under IS 1417?"),
    ]

    for label, q in test_queries:
        print(f"\n==================== Testing: {label} ('{q}') ====================")
        t0 = time.time()
        try:
            req = QueryRequest(query=q)
            res = await handle_query(req)
            elapsed = time.time() - t0
            print(f"Elapsed: {elapsed:.2f}s")
            print(f"Category: {res.category}")
            print(f"Keywords: {res.extracted_keywords}")
            print(f"Engine: {res.engine}")
            print(f"Source URL: {res.source_url}")
            print(f"Answer Preview (first 250 chars):\n{res.answer[:250]}...")
            assert res.answer, "Answer should not be empty"
            if label != "Technical (IS 1417)":
                assert res.category == "general", f"Expected 'general' category but got {res.category}"
            print(f"PASS: {label}")
        except Exception as e:
            print(f"FAIL: {label} with error: {e}")
            raise e

if __name__ == "__main__":
    asyncio.run(test())
