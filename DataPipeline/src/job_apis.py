"""Free, key-free job-board APIs used as an automatic fallback source.

Wuzzuf (and most job boards) sit behind a Cloudflare-style verification
challenge that a plain script cannot and should not try to defeat -- that is
legitimate anti-bot protection, not a bug to route around. `wuzzuf_scraper.py`
still drives a real, visible browser for the cases where a human can clear
that check once and let the session persist. This module is the alternative
for the *unattended* scheduled refresh: two job-board APIs that are public,
free, require no login/key, and return no verification wall at all --

- RemoteOK   (https://remoteok.com/api)                  -- broad, global, no params
- Arbeitnow  (https://www.arbeitnow.com/api/job-board-api) -- broad, mostly EU

Neither API lets you ask "give me Network Security jobs" -- they return their
latest postings across every category, unlabelled. So classification reuses
the project's own `skills_dictionary.json`: a posting is accepted for a track
only if its title + description contain at least MIN_SKILL_HITS *distinct*
keywords from that track's list. A single generic word ("cloud", "AI") is not
enough on these mixed-category feeds; requiring several distinct hits is what
keeps false positives down without any ML.

Coverage is honest, not perfect: Backend/Frontend/Full-Stack/DevOps/Mobile/ML
postings show up regularly. Network Administration and Network Security
listings are rare on these boards (they're not "remote tech" job boards, they're
general boards); for those tracks the manual CSV seed remains the primary path
until real data is available -- see README.md.
"""
from __future__ import annotations

import html
import json
import re
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from refresh_pipeline import DICTIONARY_PATH, validate_track

REMOTEOK_URL = "https://remoteok.com/api"
ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"
MIN_SKILL_HITS = 3
USER_AGENT = "Mozilla/5.0 (compatible; SkillGap-MVP/1.0; +data-pipeline)"

_pool_cache: list[dict[str, object]] | None = None


def _get_json(url: str, timeout: int = 20) -> dict | list:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8", errors="ignore"))


def _strip_html(value: str) -> str:
    return re.sub(r"<[^>]+>", " ", html.unescape(value or ""))


def _fetch_remoteok() -> list[dict[str, object]]:
    try:
        rows = _get_json(REMOTEOK_URL)
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
        print(f"[api] remoteok fetch failed: {exc}")
        return []
    postings = []
    for row in rows[1:]:  # index 0 is a legal notice, not a job
        try:
            posted = datetime.fromtimestamp(int(row.get("epoch")), tz=timezone.utc)
        except (TypeError, ValueError):
            posted = None
        postings.append({
            "job_title": row.get("position", ""),
            "company": row.get("company", ""),
            "description_text": _strip_html(row.get("description", "")),
            "source": "remoteok_api",
            "posted_at": posted,
        })
    print(f"[api] remoteok: fetched {len(postings)} postings")
    return postings


def _fetch_arbeitnow() -> list[dict[str, object]]:
    try:
        payload = _get_json(ARBEITNOW_URL)
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
        print(f"[api] arbeitnow fetch failed: {exc}")
        return []
    postings = []
    for row in payload.get("data", []):
        try:
            posted = datetime.fromtimestamp(int(row.get("created_at")), tz=timezone.utc)
        except (TypeError, ValueError):
            posted = None
        tags = " ".join(row.get("tags", []) or [])
        postings.append({
            "job_title": row.get("title", ""),
            "company": row.get("company_name", ""),
            "description_text": f"{_strip_html(row.get('description', ''))} {tags}".strip(),
            "source": "arbeitnow_api",
            "posted_at": posted,
        })
    print(f"[api] arbeitnow: fetched {len(postings)} postings")
    return postings


def _load_pool(force: bool = False) -> list[dict[str, object]]:
    global _pool_cache
    if _pool_cache is None or force:
        _pool_cache = _fetch_remoteok() + _fetch_arbeitnow()
        print(f"[api] pool ready: {len(_pool_cache)} candidate postings (shared across tracks for this cycle)")
    return _pool_cache


def reset_pool_cache() -> None:
    """Force the next fetch to hit the APIs again instead of reusing this cycle's pool."""
    global _pool_cache
    _pool_cache = None


def _skill_pattern(skill: str) -> re.Pattern[str]:
    escaped = re.escape(skill.strip()).replace(r"\ ", r"\s+")
    return re.compile(r"(?<!\w)" + escaped + r"(?!\w)", re.IGNORECASE)


def _distinct_hits(text: str, keywords: list[str]) -> set[str]:
    return {keyword for keyword in keywords if _skill_pattern(keyword).search(text)}


def fetch_jobs_for_track(track: str, days_back: int = 2, dictionary_path: Path | None = None) -> list[dict[str, str]]:
    """Pull the shared API pool and keep only postings that look like `track`.

    A posting counts as belonging to `track` when its title + description
    contain at least MIN_SKILL_HITS distinct keywords from that track's entry
    in skills_dictionary.json, and its posted date falls within days_back.
    """
    validate_track(track)
    dictionary_path = dictionary_path or DICTIONARY_PATH
    with dictionary_path.open(encoding="utf-8") as handle:
        keywords = json.load(handle)[track]

    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    matched: list[dict[str, str]] = []
    for row in _load_pool():
        haystack = f"{row['job_title']} {row['description_text']}"
        hits = _distinct_hits(haystack, keywords)
        if len(hits) < MIN_SKILL_HITS:
            continue
        posted = row["posted_at"] or datetime.now(timezone.utc)
        if posted < cutoff:
            continue
        matched.append({
            "job_title": row["job_title"],
            "company": row["company"],
            "description_text": row["description_text"],
            "source": row["source"],
            "date_collected": posted.date().isoformat(),
            "track": track,
        })
    print(f"[api] {track}: {len(matched)} postings matched (>= {MIN_SKILL_HITS} distinct skills, within {days_back}d)")
    return matched
