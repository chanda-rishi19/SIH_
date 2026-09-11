import asyncio
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import handle_query, QueryRequest

async def test_attachments():
    print("=== Testing Document Attachment ===")
    sample_text = "Standard Test Report: Product conforms to IS 1417:2016 for 22K (916 purity) Gold Hallmarking with valid HUID."
    sample_b64 = base64.b64encode(sample_text.encode("utf-8")).decode("utf-8")
    
    req_doc = QueryRequest(
        query="Verify if this attached document meets purity guidelines.",
        attachment_name="sample_gold_report.txt",
        attachment_type="document",
        attachment_data=f"data:text/plain;base64,{sample_b64}",
    )
    
    res_doc = await handle_query(req_doc)
    print(f"Doc Response Engine: {res_doc.engine}")
    print(f"Doc Response Preview:\n{res_doc.answer[:250]}...\n")
    assert res_doc.answer, "Doc answer should not be empty"

    print("=== Testing Image Attachment ===")
    # 1x1 white transparent PNG
    tiny_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    img_b64 = base64.b64encode(tiny_png).decode("utf-8")

    req_img = QueryRequest(
        query="What standard applies to this product label?",
        attachment_name="isi_product_photo.png",
        attachment_type="image",
        attachment_data=f"data:image/png;base64,{img_b64}",
    )
    
    res_img = await handle_query(req_img)
    print(f"Image Response Engine: {res_img.engine}")
    print(f"Image Response Preview:\n{res_img.answer[:250]}...\n")
    assert res_img.answer, "Image answer should not be empty"
    print("ALL ATTACHMENT TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test_attachments())
