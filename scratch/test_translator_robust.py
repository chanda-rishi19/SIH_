import re
import urllib.request
import urllib.parse
import json
import time

def clean_html_entities(text: str) -> str:
    text = text.replace("&quot;", '"')
    text = text.replace("&#39;", "'")
    text = text.replace("&amp;", "&")
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    return text

def translate_fast_mymemory(text: str, target_lang: str, source_lang: str = "en") -> str:
    """
    Translates text preserving markdown structure, bullets, and IS numbers using MyMemory.
    Handles chunking up to 450 characters per request.
    """
    if not text.strip():
        return ""
        
    paragraphs = text.split("\n\n")
    translated_paras = []
    
    for para in paragraphs:
        lines = para.split("\n")
        translated_lines = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                translated_lines.append("")
                continue
                
            # Detect markdown list or heading prefix
            match = re.match(r"^(\s*(?:#{1,6}\s+|[-*•]\s+|\d+\.\s+))(.*)$", line)
            if match:
                prefix = match.group(1)
                content = match.group(2).strip()
            else:
                prefix = ""
                content = stripped
                
            if not content or not any(c.isalpha() for c in content):
                translated_lines.append(line)
                continue
                
            # If content is short enough, translate directly
            if len(content) <= 450:
                url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(content)}&langpair={source_lang}|{target_lang}"
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                try:
                    with urllib.request.urlopen(req, timeout=4.5) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        t_text = data.get("responseData", {}).get("translatedText")
                        if t_text:
                            translated_lines.append(prefix + clean_html_entities(t_text))
                            continue
                except Exception as err:
                    print(f"MyMemory line err: {err}")
                    
            translated_lines.append(line)
        translated_paras.append("\n".join(translated_lines))
        
    return "\n\n".join(translated_paras)

if __name__ == "__main__":
    sample = """### Bureau of Indian Standards (BIS) Guidance: IS 1417:2016

**Gold and Gold Alloys — Hallmarking Requirements:**
Under IS 1417:2016, hallmarking is compulsory for gold jewelry sold in designated districts of India.

**Official Purity Standards:**
- **24K (999)**: 99.9% pure gold.
- **22K (916)**: 91.6% pure gold.
- **18K (750)**: 75.0% pure gold.

Each hallmarked piece must feature:
1. BIS Logo (Triangle).
2. Purity in Karat and fineness (e.g., 22K916).
3. 6-digit alphanumeric HUID (Hallmark Unique Identification).
"""
    t0 = time.time()
    res = translate_fast_mymemory(sample, "hi")
    print(f"Translated in {time.time() - t0:.2f}s:\n{res}")
