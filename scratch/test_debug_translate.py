import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import handle_query, handle_translate, QueryRequest, TranslateRequest

async def test_debug():
    import time
    print("1. Sending query in English...")
    t_start = time.time()
    q_req = QueryRequest(query="What are the purity grades and hallmarking rules under IS 1417?", language="en")
    q_res = await handle_query(q_req)
    print(f"Answer generated in {time.time() - t_start:.2f}s, length: {len(q_res.answer)}")
    print("Answer preview:\n", q_res.answer[:200])

    print("\n2. Calling handle_translate to Marathi (mr)...")
    t0 = time.time()
    t_req_mr = TranslateRequest(text=q_res.answer, target_language="mr")
    t_res_mr = await handle_translate(t_req_mr)
    t1 = time.time()
    print(f"Marathi translation took: {t1 - t0:.2f}s, length: {len(t_res_mr.translated_text)}")
    print("Marathi preview:\n", t_res_mr.translated_text[:300])

    print("\n3. Calling handle_translate to Hindi (hi)...")
    t2 = time.time()
    t_req_hi = TranslateRequest(text=q_res.answer, target_language="hi")
    t_res_hi = await handle_translate(t_req_hi)
    t3 = time.time()
    print(f"Hindi translation took: {t3 - t2:.2f}s, length: {len(t_res_hi.translated_text)}")
    print("Hindi preview:\n", t_res_hi.translated_text[:300])

    print("\n4. Testing Cache Hit (Marathi)...")
    t4 = time.time()
    t_res_cached = await handle_translate(t_req_mr)
    t5 = time.time()
    print(f"Cache Hit took: {(t5 - t4)*1000:.2f}ms")
    assert t_res_cached.translated_text == t_res_mr.translated_text
    print("\n=== ALL TRANSLATION TESTS PASSED EXCELLENTLY! ===")

if __name__ == "__main__":
    asyncio.run(test_debug())
