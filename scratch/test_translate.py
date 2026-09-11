import sys
import os
sys.path.insert(0, os.path.abspath("."))
import time
from backend.llm.translator import translate_text

sample_text = """
### Indian Standard IS 1417:2016 Gold Hallmarking
Bureau of Indian Standards (BIS) mandates hallmarking for gold jewellery and artefacts under IS 1417.

1. **Purity Grades**:
   - 24K (995 or 999 purity)
   - 22K (916 purity)
   - 18K (750 purity)
   - 14K (585 purity)

2. **Hallmark Signs**:
   - BIS Logo
   - Purity in Karat and Fineness
   - 6-digit alphanumeric HUID (Hallmark Unique Identification) code.
"""

print("Starting translation test...")
t0 = time.time()
res = translate_text(sample_text, target_language="hi")
t1 = time.time()
print(f"Elapsed: {t1 - t0:.2f}s")
print("Result:")
print(res)
