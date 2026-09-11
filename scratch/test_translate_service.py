import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.llm.translator import translate_text

async def test_translate():
    sample_text = """### Key Hallmarking Rules
- Under IS 1417:2016, gold hallmarking is mandatory in India.
- Permitted fineness grades are 14K (585), 18K (750), 20K (833), 22K (916), 23K (958), and 24K (999).
- Each article must be engraved with a 6-digit alphanumeric HUID code."""

    print("Testing Translation to Hindi...")
    hi_trans = translate_text(sample_text, target_language="hi")
    print("--- Hindi Result ---")
    print(hi_trans)
    assert "IS 1417" in hi_trans or "1417" in hi_trans
    assert "HUID" in hi_trans

    print("\nTesting Cache (should be instantaneous)...")
    import time
    t0 = time.time()
    cached_trans = translate_text(sample_text, target_language="hi")
    elapsed = time.time() - t0
    print(f"Elapsed time for cached translation: {elapsed*1000:.2f}ms")
    assert cached_trans == hi_trans
    assert elapsed < 0.05, "Cache lookup should take less than 50ms"

    print("\nALL TRANSLATOR TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test_translate())
