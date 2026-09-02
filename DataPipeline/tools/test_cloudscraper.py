"""Unattended cloudscraper probe; this does not touch the production scraper."""
from __future__ import annotations

import re
import time

import cloudscraper

URL = "https://wuzzuf.net/search/jobs/?q=DevOps%20Cloud%20Engineering"


def main() -> None:
    started = time.perf_counter()
    scraper = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows", "mobile": False})
    try:
        response = scraper.get(URL, timeout=30)
        elapsed = time.perf_counter() - started
        body = response.text
        links = sorted(set(re.findall(r'href=["\']([^"\']*/jobs/[^"\']*)', body, re.IGNORECASE)))
        challenge = any(term in body.casefold() for term in ("just a moment", "cf-chl-", "captcha", "challenge-platform"))
        real_listing = bool(links) and not challenge
        print(f"status_code={response.status_code}")
        print(f"response_time_seconds={elapsed:.2f}")
        print(f"real_listing_html={real_listing}")
        print(f"challenge_page={challenge}")
        print(f"job_links_found={len(links)}")
        print("body_first_500_chars=")
        print(body[:500])
    except Exception as exc:
        elapsed = time.perf_counter() - started
        print(f"status_code=ERROR")
        print(f"response_time_seconds={elapsed:.2f}")
        print(f"error={exc}")


if __name__ == "__main__":
    main()
