"""Minimal Wuzzuf scraper with a manual CSV fallback.

Wuzzuf can change its HTML without notice. The parser intentionally accepts
listing cards using common HTML attributes and returns the schema expected by
the rest of the pipeline. A manual CSV is recommended for repeatable seeding.
"""
from __future__ import annotations

import argparse
import csv
import time
import urllib.error
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path

from refresh_pipeline import FIXED_TRACKS, RAW_COLUMNS, validate_track

PROFILE_DIR = Path(__file__).resolve().parent.parent / "data" / "browser_profile"


class _ListingParser(HTMLParser):
    def __init__(self, track: str) -> None:
        super().__init__()
        self.track = track
        self.current: dict[str, str] | None = None
        self.rows: list[dict[str, str]] = []
        self.in_title = False
        self.in_description = False
        self.buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        classes = attrs_dict.get("class", "") or ""
        if tag == "a" and attrs_dict.get("href", "").startswith("/jobs/"):
            self.current = {"job_title": "", "company": "", "description_text": "", "source": "wuzzuf", "date_collected": datetime.now(timezone.utc).date().isoformat(), "track": self.track}
            self.current["_url"] = urllib.parse.urljoin("https://wuzzuf.net", attrs_dict["href"])
            self.in_title = True
            self.buffer = []
        elif self.current and ("description" in classes.lower() or "job-description" in classes.lower()):
            self.in_description = True
            self.buffer = []

    def handle_data(self, data: str) -> None:
        if self.current and (self.in_title or self.in_description):
            self.buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if not self.current:
            return
        text = re.sub(r"\s+", " ", " ".join(self.buffer)).strip()
        if tag == "a" and self.in_title:
            self.current["job_title"] = text
            self.in_title = False
        if self.in_description and tag in {"div", "p"}:
            self.current["description_text"] = text
            self.in_description = False
        if tag == "a" and self.current.get("job_title"):
            if not any(row.get("_url") == self.current["_url"] for row in self.rows):
                self.rows.append(self.current)
            self.current = None


def _request(url: str, timeout: int, retries: int = 3) -> str:
    for attempt in range(retries):
        request = urllib.request.Request(url, headers={"User-Agent": "SkillGap-MVP/1.0"})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read().decode("utf-8", errors="ignore")
        except urllib.error.HTTPError as exc:
            if exc.code not in {403, 429, 500, 502, 503, 504} or attempt == retries - 1:
                raise
            retry_after = exc.headers.get("Retry-After")
            delay = int(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt
            print(f"[scrape] retrying {url} after HTTP {exc.code} in {delay}s")
            time.sleep(delay)
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt == retries - 1:
                raise
            delay = 2 ** attempt
            print(f"[scrape] retrying {url} after {exc} in {delay}s")
            time.sleep(delay)
    raise RuntimeError(f"request failed: {url}")


def _listing_count(page_html: str) -> int | None:
    matches = re.findall(r"(?i)(\d[\d,]*)\s+(?:jobs?|results?|vacancies)", page_html)
    return max((int(value.replace(",", "")) for value in matches), default=None)


def _next_page(page_html: str, current_page: int, track: str) -> str | None:
    match = re.search(r'(?is)<a[^>]+(?:rel=["\']next["\']|aria-label=["\'][^"\']*next[^"\']*["\'])[^>]+href=["\']([^"\']+)', page_html)
    if match:
        return urllib.parse.urljoin("https://wuzzuf.net", match.group(1))
    if re.search(r"(?is)<a[^>]+href=[\"'][^\"']+[\"'][^>]*>\s*next\s*</a>", page_html):
        href = re.search(r'(?is)<a[^>]+href=["\']([^"\']+)["\'][^>]*>\s*next\s*</a>', page_html)
        return urllib.parse.urljoin("https://wuzzuf.net", href.group(1)) if href else None
    query = urllib.parse.urlencode({"q": track, "start": current_page * 15})
    return f"https://wuzzuf.net/search/jobs/?{query}"


def _detail_fields(page_html: str) -> tuple[str, str, str, datetime | None]:
    def meta(name: str) -> str:
        match = re.search(rf'(?is)<meta[^>]+(?:name|property)=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']', page_html)
        return re.sub(r"\s+", " ", match.group(1)).strip() if match else ""

    title = meta("og:title") or meta("twitter:title")
    description = meta("description") or meta("og:description")
    posted_value = meta("datePosted")
    json_date = re.search(r'"datePosted"\s*:\s*"([^"]+)"', page_html)
    posted_value = posted_value or (json_date.group(1) if json_date else "")
    try:
        posted = datetime.fromisoformat(posted_value.replace("Z", "+00:00")) if posted_value else None
        if posted and posted.tzinfo is None:
            posted = posted.replace(tzinfo=timezone.utc)
    except ValueError:
        posted = None
    json_description = re.search(r'"description"\s*:\s*"(.*?)"', page_html, re.IGNORECASE)
    description = description or (json_description.group(1) if json_description else "")
    return title, re.sub(r"<[^>]+>", " ", description), posted_value, posted


def scrape_wuzzuf(track: str, days_back: int = 2, timeout: int = 20) -> list[dict[str, str]]:
    validate_track(track)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("Playwright is required. Install it with: pip install playwright && playwright install chromium") from exc

    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    query = urllib.parse.urlencode({"q": track})
    next_url = f"https://wuzzuf.net/search/jobs/?{query}"
    seen_pages: set[str] = set()
    listings: dict[str, dict[str, str]] = {}
    expected_count: int | None = None
    page_number = 0
    failed_pages = 0
    failed_details = 0

    with sync_playwright() as playwright:
        PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        browser = playwright.chromium.launch_persistent_context(str(PROFILE_DIR), headless=False)
        page = browser.pages[0] if browser.pages else browser.new_page()
        print(f"[debug] {track}: browser_profile={PROFILE_DIR.resolve()} cookies_at_start={len(browser.cookies())}")
        print(f"[debug] {track}: listing_track_filter=none (all links on matching Wuzzuf search pages are collected)")
        try:
            while next_url and next_url not in seen_pages:
                seen_pages.add(next_url)
                page_number += 1
                print(f"[debug] {track}: page={page_number} visiting_url={next_url}")
                try:
                    page.goto(next_url, wait_until="domcontentloaded", timeout=timeout * 1000)
                    page.wait_for_timeout(3000)
                    page_title = page.title()
                    print(f"[debug] {track}: page={page_number} landed_url={page.url} title={page_title!r} cookies={len(browser.cookies())}")
                    if "just a moment" in page_title.casefold() or "verify" in page_title.casefold() or "captcha" in page_title.casefold():
                        print(f"[scrape] {track}: complete the Wuzzuf browser check in the visible window; waiting 60 seconds")
                        page.wait_for_timeout(60000)
                    page_html = page.content()
                except Exception as exc:
                    failed_pages += 1
                    print(f"[scrape] {track}: page={page_number} failed={exc}")
                    break
                expected_count = expected_count or _listing_count(page_html)
                parser = _ListingParser(track)
                parser.feed(page_html)
                before = len(listings)
                for row in parser.rows:
                    listings.setdefault(row["_url"], row)
                print(f"[scrape] {track}: page={page_number} page_listings={len(parser.rows)} total_unique={len(listings)}")
                candidate_next_url = _next_page(page_html, page_number, track) if parser.rows and len(listings) > before else None
                print(f"[debug] {track}: page={page_number} next_page_selector=explicit-next-or-start-fallback next_page_url={candidate_next_url}")
                next_url = candidate_next_url

            result = []
            detail_successes = 0
            for index, row in enumerate(listings.values(), start=1):
                try:
                    print(f"[debug] {track}: detail={index}/{len(listings)} requesting_url={row['_url']}")
                    page.goto(row["_url"], wait_until="domcontentloaded", timeout=timeout * 1000)
                    page.wait_for_timeout(1000)
                    detail_title = page.title()
                    redirected = page.url.rstrip("/") != row["_url"].rstrip("/")
                    challenge = any(term in detail_title.casefold() for term in ("just a moment", "verify", "captcha"))
                    title, description, posted_raw, posted = _detail_fields(page.content())
                    print(f"[debug] {track}: detail={index}/{len(listings)} loaded=True redirected={redirected} challenge={challenge} landed_url={page.url}")
                    print(f"[debug] {track}: detail={index}/{len(listings)} posted_date_raw={posted_raw!r} parsed_date={posted!r}")
                    detail_successes += 1
                except Exception as exc:
                    failed_details += 1
                    print(f"[debug] {track}: detail={index}/{len(listings)} loaded=False redirected_or_failed=True error={exc}")
                    print(f"[scrape] {track}: listing={index}/{len(listings)} failed={exc}")
                    result.append({"job_title": row["job_title"], "company": "", "description_text": "", "source": "wuzzuf_detail_failed", "date_collected": datetime.now(timezone.utc).date().isoformat(), "track": track})
                    continue
                if posted and posted < cutoff:
                    continue
                result.append({"job_title": title or row["job_title"], "company": "", "description_text": description, "source": "wuzzuf", "date_collected": (posted or datetime.now(timezone.utc)).date().isoformat(), "track": track})
        finally:
            browser.close()
    expected = str(expected_count) if expected_count is not None else "unknown"
    print(f"[debug] {track}: detail_summary=loaded_{detail_successes}_of_{len(listings)} failed={failed_details}")
    print(f"[scrape] {track}: sanity postings_in_window={len(result)} wuzzuf_listing_count={expected} pages={page_number} failed_pages={failed_pages} failed_details={failed_details}")
    if expected_count is not None and len(listings) < expected_count:
        print(f"[scrape] WARNING {track}: collected {len(listings)} unique listing links but Wuzzuf reports {expected_count}")
    return result


def load_manual_csv(path: Path, track: str) -> list[dict[str, str]]:
    validate_track(track)
    with path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    return [{column: row.get(column, "") or (track if column == "track" else "") for column in RAW_COLUMNS} for row in rows]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--track", required=True, choices=FIXED_TRACKS)
    parser.add_argument("--days-back", type=int, default=2)
    parser.add_argument("--manual-csv", type=Path)
    args = parser.parse_args()
    rows = load_manual_csv(args.manual_csv, args.track) if args.manual_csv else scrape_wuzzuf(args.track, args.days_back)
    print(f"{len(rows)} rows ready for refresh")


if __name__ == "__main__":
    main()
