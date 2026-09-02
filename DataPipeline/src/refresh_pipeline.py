"""Scheduled rolling refresh and downstream ETL for the eight supported tracks."""
from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

FIXED_TRACKS = [
    "Backend Development", "Frontend Development", "Full-Stack Development", "Mobile Development",
    "DevOps & Cloud Engineering", "Network Administration", "Network Security", "Machine Learning / AI",
]
RAW_COLUMNS = ["job_title", "company", "description_text", "source", "date_collected", "track"]
BASE_DIR = Path(__file__).resolve().parent.parent  # DataPipeline/ (this file lives in src/)
RAW_DIR = BASE_DIR / "data" / "raw"
CLEAN_DIR = BASE_DIR / "data" / "clean"
SKILLS_DIR = BASE_DIR / "data" / "skills"
CACHE_PATH = BASE_DIR / "data" / "track_cache.json"
DICTIONARY_PATH = BASE_DIR / "config" / "skills_dictionary.json"


def validate_track(track: str) -> None:
    if track not in FIXED_TRACKS:
        raise ValueError(f"Unsupported track: {track}. Choose one of: {', '.join(FIXED_TRACKS)}")


def slugify(track: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", track.lower()).strip("_")


def paths_for(track: str) -> dict[str, Path]:
    validate_track(track)
    slug = slugify(track)
    return {"raw": RAW_DIR / f"raw_jobs_{slug}.csv", "clean": CLEAN_DIR / f"clean_jobs_{slug}.csv", "skills": SKILLS_DIR / f"extracted_skills_{slug}.csv", "frequency": SKILLS_DIR / f"skill_frequency_{slug}.csv"}


def _read_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _write_raw(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=RAW_COLUMNS)
        writer.writeheader()
        writer.writerows({column: row.get(column, "") for column in RAW_COLUMNS} for row in rows)


def _load_cache() -> dict[str, dict[str, str]]:
    if CACHE_PATH.exists():
        with CACHE_PATH.open(encoding="utf-8") as handle:
            return json.load(handle)
    return {}


def _update_cache(track: str, timestamp: datetime, paths: dict[str, Path]) -> None:
    cache = _load_cache()
    cache[track] = {"last_scraped_at": timestamp.isoformat(timespec="seconds"), "raw_file_path": str(paths["raw"].relative_to(BASE_DIR)).replace("\\", "/"), "clean_file_path": str(paths["clean"].relative_to(BASE_DIR)).replace("\\", "/"), "skills_file_path": str(paths["skills"].relative_to(BASE_DIR)).replace("\\", "/"), "frequency_file_path": str(paths["frequency"].relative_to(BASE_DIR)).replace("\\", "/")}
    with CACHE_PATH.open("w", encoding="utf-8") as handle:
        json.dump(cache, handle, indent=2)
        handle.write("\n")


def _dedupe(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, ...]] = set()
    result = []
    for row in rows:
        key = tuple((row.get(column, "") or "").strip().casefold() for column in RAW_COLUMNS)
        if key not in seen:
            seen.add(key)
            result.append({column: row.get(column, "") for column in RAW_COLUMNS})
    return result


def fetch_fresh_rows(track: str, days_back: int = 2) -> list[dict[str, str]]:
    """Automated source for the scheduled refresh.

    Tries the Wuzzuf browser scraper first. Wuzzuf sits behind a Cloudflare-style
    verification challenge that an unattended script cannot (and should not try
    to) solve on its own, so a failed import, a raised error, or a 0-row result
    all fall back to free key-free job-board APIs instead -- see job_apis.py for
    why those are unattended-safe where Wuzzuf isn't. This function is never
    called when a manual CSV was explicitly requested; that path stays a
    deliberate human choice, not an automatic fallback.
    """
    try:
        from wuzzuf_scraper import scrape_wuzzuf
        rows = scrape_wuzzuf(track, days_back=days_back)
        if rows:
            return rows
        print(f"[fetch] {track}: Wuzzuf scrape returned 0 rows, falling back to free job APIs")
    except Exception as exc:
        print(f"[fetch] {track}: Wuzzuf scrape unavailable ({exc}); falling back to free job APIs")
    from job_apis import fetch_jobs_for_track
    return fetch_jobs_for_track(track, days_back=days_back)


def scheduled_refresh(track: str, new_raw: list[dict[str, str]] | None = None) -> dict[str, int]:
    validate_track(track)
    from clean import clean_file

    paths = paths_for(track)
    now = datetime.now(timezone.utc)
    fresh = new_raw if new_raw is not None else fetch_fresh_rows(track, days_back=2)
    existing = _read_rows(paths["raw"])
    print(f"[debug] {track}: raw_file_path={paths['raw'].resolve()} loaded_rows={len(existing)}")
    cutoff = now - timedelta(days=7)
    retained = []
    dropped = 0
    for row in existing:
        try:
            collected = datetime.fromisoformat(row["date_collected"].replace("Z", "+00:00"))
            if collected.tzinfo is None:
                collected = collected.replace(tzinfo=timezone.utc)
        except (KeyError, ValueError):
            dropped += 1
            continue
        if collected >= cutoff:
            retained.append(row)
        else:
            dropped += 1
    merged = _dedupe(retained + fresh)
    _write_raw(paths["raw"], merged)
    _update_cache(track, now, paths)
    stats = clean_file(paths["raw"], track, DICTIONARY_PATH, paths["clean"], paths["skills"], paths["frequency"])
    print(f"[refresh] {track}: fresh={len(fresh)} dropped_old={dropped} stored={len(merged)}")
    return {"fresh": len(fresh), "dropped_old": dropped, "stored": len(merged), **stats}


def refresh_all_tracks() -> None:
    from job_apis import reset_pool_cache
    reset_pool_cache()  # fetch the API pool once per cycle, shared by all 8 tracks
    for track in FIXED_TRACKS:
        scheduled_refresh(track)


def get_track_data(track: str) -> dict[str, list[dict[str, str]]]:
    paths = paths_for(track)
    return {name: _read_rows(path) for name, path in paths.items() if name != "raw"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--track", choices=FIXED_TRACKS)
    parser.add_argument("--manual-csv", type=Path)
    parser.add_argument("--source", choices=["auto", "wuzzuf", "api"], default="auto", help="auto: Wuzzuf then API fallback (default). wuzzuf/api: force one source, skip the other, for testing.")
    parser.add_argument("--days-back", type=int, default=2)
    args = parser.parse_args()
    if args.track:
        manual_rows = None
        if args.manual_csv:
            from wuzzuf_scraper import load_manual_csv
            manual_rows = load_manual_csv(args.manual_csv, args.track)
        elif args.source == "wuzzuf":
            from wuzzuf_scraper import scrape_wuzzuf
            manual_rows = scrape_wuzzuf(args.track, days_back=args.days_back)
        elif args.source == "api":
            from job_apis import fetch_jobs_for_track
            manual_rows = fetch_jobs_for_track(args.track, days_back=args.days_back)
        scheduled_refresh(args.track, manual_rows)
    else:
        refresh_all_tracks()


if __name__ == "__main__":
    main()
