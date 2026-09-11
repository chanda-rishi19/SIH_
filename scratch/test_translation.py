import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.llm.local import query_local_llm

prompt = """Translate the following text into Hindi (हिन्दी). Do not add any conversational filler, return ONLY the translated markdown text:

### Key Requirements
- Under IS 1417:2016, gold hallmarking is mandatory.
- Standard purity grades are 14K (585), 18K (750), 20K (833), 22K (916), 23K (958), and 24K (999).
- Each hallmarked article must bear a 6-digit alphanumeric HUID (Hallmark Unique Identification)."""

system_prompt = "You are a professional multilingual translator specializing in Indian languages and Bureau of Indian Standards regulatory terminology."

print("Testing Ollama translation to Hindi...")
res = query_local_llm(prompt, system_prompt)
print("Result:\n", res)
