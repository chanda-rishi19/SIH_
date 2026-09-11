import urllib.request
import urllib.parse
import json
import time

sample_text = """**IS 1417 specifies gold purity grades and hallmarking rules:**

### Purity Grades:
- **24K (999 or 995 fine gold)**: Used for bullion and coins.
- **22K (916 purity)**: Most widely used for traditional Indian jewellery.
- **18K (750 purity)**: Commonly used for diamond-studded jewellery.
- **14K (585 purity)**: Modern lightweight jewellery.

### Official Hallmarking Signs:
1. **BIS Logo**: The triangular stamp of the Bureau of Indian Standards.
2. **Purity & Fineness**: For instance, 22K916 or 18K750.
3. **6-Digit Alphanumeric HUID**: Hallmark Unique Identification laser-etched on each piece."""

def fast_translate(text: str, target_lang: str):
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={urllib.parse.quote(text)}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        # data[0] contains array of translated segments: [translated_segment, original_segment, ...]
        translated_segments = [seg[0] for seg in data[0] if seg and seg[0]]
        return "".join(translated_segments)

print("--- Testing Marathi (mr) Translation ---")
t0 = time.time()
marathi_text = fast_translate(sample_text, "mr")
t1 = time.time()
print(f"Elapsed: {(t1 - t0)*1000:.1f}ms")
print(marathi_text)

print("\n--- Testing Hindi (hi) Translation ---")
t0 = time.time()
hindi_text = fast_translate(sample_text, "hi")
t1 = time.time()
print(f"Elapsed: {(t1 - t0)*1000:.1f}ms")
print(hindi_text)
