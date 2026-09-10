import asyncio
import os
from playwright.async_api import async_playwright

async def run_chat():
    out_dir = r"C:\Users\chris\.gemini\antigravity-ide\brain\24fd1ba3-d2b2-4ea7-8fe1-8b8205c6c898"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1000, "height": 900})
        await page.goto("http://localhost:8000/", wait_until="networkidle")
        # Click the first chip
        chips = await page.query_selector_all(".chat-chip")
        if chips:
            await chips[0].click()
            print("Clicked prompt chip, waiting for response...")
            await page.wait_for_selector(".standards-grid", timeout=40000)
            await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(out_dir, "chatbot_response_preview.png"))
            print("Chat response screenshot captured successfully!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_chat())
