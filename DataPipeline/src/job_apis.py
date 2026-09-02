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
latest postings across every category, unlabelled, so every posting has to be
assigned to (at most) one of the 8 tracks. Classification is two-tiered:

1. Title hints (TITLE_HINTS below): a small set of near-unambiguous phrases
   per track ("devops", "ai engineer", "full stack", ...). If exactly one
   track's hints appear in the job title, that title is trusted outright --
   titles are written by the poster to say what the role actually is, so this
   is the highest-precision signal available without ML.
2. Otherwise, fall back to `skills_dictionary.json`: count each track's
   *distinct* keyword hits in title + description, and assign the posting to
   whichever track scores highest -- but only if that top score clears
   MIN_SKILL_HITS *and* beats the runner-up track, so a posting that matches
   two tracks about equally (mostly generic keywords like "python", "aws",
   "docker") is dropped instead of guessed at.

Earlier versions of this module tested each track independently against the
whole pool, so a single posting (say "AI Engineer" mentioning Docker/Azure/
Python) could clear the threshold for DevOps *and* ML/AI *and* Full-Stack at
once and get duplicated into all three. Classification now happens once per
posting across all 8 tracks together, so each posting lands in at most one
track's output.

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

from refresh_pipeline import DICTIONARY_PATH, FIXED_TRACKS, validate_track

REMOTEOK_URL = "https://remoteok.com/api"
ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"
MIN_SKILL_HITS = 4  # for the title-less keyword fallback only; a title-based pick only needs >=1 hit as a sanity check
USER_AGENT = "Mozilla/5.0 (compatible; SkillGap-MVP/1.0; +data-pipeline)"

# Tie-break order for the keyword fallback, most specific first. Full-Stack and
# DevOps & Cloud Engineering keep the broadest keyword lists (they legitimately
# overlap with Backend/Frontend/Network Administration's own lists), so on an
# exact score tie the narrower, more specific track should win rather than
# whichever track happens to have the bigger dictionary.
TRACK_PRIORITY = [
    "Backend Development", "Frontend Development", "Mobile Development",
    "Network Administration", "Network Security", "Machine Learning / AI",
    "Full-Stack Development", "DevOps & Cloud Engineering",
]

# Near-unambiguous title phrases per track, checked against a hyphen-normalized,
# lowercased job_title. Deliberately narrow -- these should almost never appear
# in a posting for a *different* track, unlike generic skill keywords.
TITLE_HINTS: dict[str, list[str]] = {
    "Backend Development": ["backend", "back end"],
    "Frontend Development": ["frontend", "front end"],
    "Full-Stack Development": ["full stack", "fullstack"],
    "Mobile Development": ["mobile developer", "mobile engineer", "ios developer", "ios engineer", "android developer", "android engineer", "react native developer"],
    "DevOps & Cloud Engineering": ["devops", "dev ops", "site reliability", "sre engineer", "platform engineer", "cloud engineer", "infrastructure engineer"],
    "Network Administration": ["network administrator", "systems administrator", "system administrator", "network engineer", "it administrator", "sysadmin"],
    "Network Security": ["security engineer", "cybersecurity", "cyber security", "security analyst", "penetration tester", "infosec", "information security"],
    "Machine Learning / AI": ["machine learning", "ai engineer", "data scientist", "ml engineer", "artificial intelligence", "deep learning"],
}

_pool_cache: list[dict[str, object]] | None = None
_classified_cache: dict[str, list[dict[str, object]]] | None = None


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
    global _pool_cache, _classified_cache
    _pool_cache = None
    _classified_cache = None


def _skill_pattern(skill: str) -> re.Pattern[str]:
    escaped = re.escape(skill.strip()).replace(r"\ ", r"\s+")
    return re.compile(r"(?<!\w)" + escaped + r"(?!\w)", re.IGNORECASE)


def _distinct_hits(text: str, keywords: list[str]) -> set[str]:
    return {keyword for keyword in keywords if _skill_pattern(keyword).search(text)}


def _title_track(job_title: str) -> str | None:
    """Return the one track whose title hints appear in job_title, or None
    if zero or more than one track matches (both cases are too ambiguous to
    trust the title alone)."""
    normalized = f" {job_title.lower().replace('-', ' ')} "
    matches = [track for track, hints in TITLE_HINTS.items() if any(hint in normalized for hint in hints)]
    return matches[0] if len(matches) == 1 else None


def _classify(row: dict[str, object], dictionary: dict[str, list[str]]) -> str | None:
    """Assign one posting to at most one track: trust an unambiguous title,
    otherwise pick whichever track's dictionary scores highest -- as long as
    it clears MIN_SKILL_HITS. Exact ties go to the more specific track
    (TRACK_PRIORITY), not to whichever list happens to be bigger."""
    title_pick = _title_track(str(row["job_title"]))
    haystack = f"{row['job_title']} {row['description_text']}"
    scores = {track: len(_distinct_hits(haystack, keywords)) for track, keywords in dictionary.items()}

    if title_pick is not None:
        return title_pick if scores.get(title_pick, 0) >= 1 else None

    ranked = sorted(scores.items(), key=lambda item: (-item[1], TRACK_PRIORITY.index(item[0])))
    best_track, best_score = ranked[0]
    if best_score >= MIN_SKILL_HITS:
        return best_track
    return None


def _classify_pool(dictionary_path: Path | None = None) -> dict[str, list[dict[str, object]]]:
    """Partition the shared pool into {track: [postings]}, each posting in at
    most one track's list. Cached alongside the pool for one refresh cycle."""
    global _classified_cache
    if _classified_cache is not None:
        return _classified_cache

    dictionary_path = dictionary_path or DICTIONARY_PATH
    with dictionary_path.open(encoding="utf-8") as handle:
        dictionary = json.load(handle)

    buckets: dict[str, list[dict[str, object]]] = {track: [] for track in FIXED_TRACKS}
    for row in _load_pool():
        track = _classify(row, dictionary)
        if track is not None:
            buckets[track].append(row)

    counts = ", ".join(f"{track}={len(rows)}" for track, rows in buckets.items())
    print(f"[api] classified pool -> {counts}")
    _classified_cache = buckets
    return buckets


def fetch_jobs_for_track(track: str, days_back: int = 2, dictionary_path: Path | None = None) -> list[dict[str, str]]:
    """Pull the shared API pool and keep only postings classified as `track`.

    Each posting in the pool is assigned to at most one track (see _classify),
    so the same posting can never appear under two different tracks' outputs.
    """
    validate_track(track)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    matched: list[dict[str, str]] = []
    for row in _classify_pool(dictionary_path).get(track, []):
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
    print(f"[api] {track}: {len(matched)} postings matched (within {days_back}d)")
    return matched
