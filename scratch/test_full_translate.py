import urllib.request
import urllib.parse
import json
import time

def translate_chunk(chunk: str, target_lang: str) -> str:
    if not chunk.strip():
        return ""
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={urllib.parse.quote(chunk)}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        translated_segments = [seg[0] for seg in data[0] if seg and seg[0]]
        return "".join(translated_segments)

def full_translate(text: str, target_lang: str) -> str:
    # Split by double newline to preserve markdown paragraphs
    paragraphs = text.split("\n\n")
    batches = []
    current_batch = []
    current_len = 0
    
    for p in paragraphs:
        if current_len + len(p) > 1200:
            batches.append("\n\n".join(current_batch))
            current_batch = [p]
            current_len = len(p)
        else:
            current_batch.append(p)
            current_len += len(p) + 2
            
    if current_batch:
        batches.append("\n\n".join(current_batch))
        
    results = []
    for b in batches:
        results.append(translate_chunk(b, target_lang))
        
    return "\n\n".join(results)

# Test with a very long RAG response
long_text = """**Executive Summary / Direct Answer:**
The purity grades and hallmarking rules under IS 1417 are specified in the standard, which defines grades of fine gold and standard gold used for bullion and coins, as well as gold alloys for jewellery.

### Official Scope & Clause 1:
This standard prescribes requirements for purity grades of gold, standard gold alloys, and markings for jewellery, bullion, and artefacts manufactured or sold in India.

### Indian Standards Found:
- **IS 1417:2016**: Gold and Gold Alloys, Jewellery/Artefacts - Purity Grades and Hallmarking (ACTIVE)
- **Technical Committee**: MTD 10 (Precious Metals)
- **Amendments**: 2 official amendments active.

### Detailed Requirements:
1. **Mandatory Purity Grades**:
   - 24K: 995 or 999 fineness (pure gold bullion)
   - 23K: 958 fineness
   - 22K: 916 fineness (primary jewellery standard)
   - 20K: 833 fineness
   - 18K: 750 fineness
   - 14K: 585 fineness

2. **Official Hallmarking Scheme**:
   - Mandatory hallmark stamping by BIS-certified Assaying & Hallmarking Centres (AHC).
   - 6-digit alphanumeric HUID (Hallmark Unique Identification) code unique to each piece of jewellery.
   - Verification available to consumers via the BIS CARE mobile app."""

t0 = time.time()
res_mr = full_translate(long_text, "mr")
t1 = time.time()
print(f"Full text length: {len(long_text)} chars")
print(f"Total Marathi translation time: {(t1 - t0):.2f}s")
print("\n--- Resulting Translation ---")
print(res_mr)
