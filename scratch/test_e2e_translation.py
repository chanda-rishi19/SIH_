import asyncio
import os
import sys
import time
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

client = TestClient(app)

def run_tests():
    print("=== 1. Health Check ===")
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    print("Health Status:", res_health.json())

    print("\n=== 2. Testing /api/translate Endpoint ===")
    sample_text = """### BIS Hallmarking Guidelines under IS 1417:2016
- Hallmarking of gold jewellery is mandatory across India.
- Purity grades include 14K (585), 18K (750), 20K (833), 22K (916), 23K (958), and 24K (999).
- Mandatory 6-digit alphanumeric HUID (Hallmark Unique Identification) must be laser etched."""

    t0 = time.time()
    res_trans_hi = client.post(
        "/api/translate",
        json={"text": sample_text, "target_language": "hi"}
    )
    t1 = time.time()
    assert res_trans_hi.status_code == 200, f"Error: {res_trans_hi.text}"
    data_hi = res_trans_hi.json()
    print(f"Translation to Hindi took {t1 - t0:.2f}s:")
    print(data_hi["translated_text"][:250])
    assert "1417" in data_hi["translated_text"] or "IS 1417" in data_hi["translated_text"]
    assert data_hi["target_language"] == "hi"

    # Test cache hit speed
    t2 = time.time()
    res_cached = client.post(
        "/api/translate",
        json={"text": sample_text, "target_language": "hi"}
    )
    t3 = time.time()
    assert res_cached.status_code == 200
    cached_data = res_cached.json()
    assert cached_data["translated_text"] == data_hi["translated_text"]
    print(f"Cached translation took: {(t3 - t2)*1000:.2f}ms (Cache Hit!)")
    assert (t3 - t2) < 0.1, "Cache hit must be ultra-fast"

    print("\n=== 3. Testing /api/query with Hindi Language ===")
    res_query_hi = client.post(
        "/api/query",
        json={
            "query": "What are the purity grades and hallmarking rules under IS 1417?",
            "language": "hi"
        }
    )
    assert res_query_hi.status_code == 200, f"Query error: {res_query_hi.text}"
    query_data = res_query_hi.json()
    print("Query Category:", query_data["category"])
    print("Matched Standards Count:", len(query_data["matched_standards"]))
    print("Answer Preview:\n", query_data["answer"][:300])
    assert len(query_data["answer"]) > 50

    print("\n=== ALL E2E TRANSLATION AND QUERY TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
