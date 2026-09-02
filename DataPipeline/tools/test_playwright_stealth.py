"""Unattended Playwright-stealth probe; this does not touch the production scraper."""
from __future__ import annotations

import re
import time
from pathlib import Path

from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

URL = "https://wuzzuf.net/search/jobs/?q=DevOps%20Cloud%20Engineering"
PROFILE_DIR = Path(__file__).resolve().parent / "data" / "browser_profile"


def main() -> None:
    started = time.perf_counter()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch_persistent_context(str(PROFILE_DIR), headless=False)
        page = browser.pages[0] if browser.pages else browser.new_page()
        Stealth().apply_stealth_sync(page)
        try:
            page.goto(URL, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(5_000)
            title = page.title()
            body = page.content()
            links = sorted(set(re.findall(r'href=["\']([^"\']*/jobs/[^"\']*)', body, re.IGNORECASE)))
            challenge = any(term in f"{title} {body}".casefold() for term in ("just a moment", "cf-chl-", "captcha", "challenge-platform"))
            elapsed = time.perf_counter() - started
            print(f"status_code=browser")
            print(f"response_time_seconds={elapsed:.2f}")
            print(f"landed_url={page.url}")
            print(f"page_title={title!r}")
            print(f"real_listing_html={bool(links) and not challenge}")
            print(f"challenge_page={challenge}")
            print(f"job_links_found={len(links)}")
        except Exception as exc:
            elapsed = time.perf_counter() - started
            print(f"status_code=ERROR")
            print(f"response_time_seconds={elapsed:.2f}")
            print(f"error={exc}")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
