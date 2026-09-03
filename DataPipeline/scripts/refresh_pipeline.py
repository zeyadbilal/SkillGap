"""Multi-source collection and rolling 60-day training pipeline."""
import json
import os
import sys
import argparse
from datetime import datetime, timedelta, timezone

import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.clean import run_pipeline_for_track
from core.job_classifier import TRACK_KEYWORDS, classify_jobs

DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
HISTORY_FILE = os.path.join(DATA_DIR, "history", "all_jobs.csv")
CACHE_FILE = os.path.join(DATA_DIR, "track_cache.json")
CONFIG_PATH = os.path.join(BASE_DIR, "config", "config.json")
RETENTION_DAYS = 60
FETCH_DAYS = 7
DEFAULT_SOURCES = {"remotive": True, "remoteok": True, "arbeitnow": True}
BASE_COLUMNS = ["source_job_id", "job_title", "company", "location", "description_text", "url", "published_at", "date_collected", "source", "track"]


def _load_config():
    try:
        with open(CONFIG_PATH) as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError):
        return {}


def _source_settings():
    configured = _load_config().get("sources")
    if not isinstance(configured, dict):
        return {name: {"enabled": enabled} for name, enabled in DEFAULT_SOURCES.items()}
    result = {}
    for name, default in DEFAULT_SOURCES.items():
        value = configured.get(name, {"enabled": default})
        result[name] = value if isinstance(value, dict) else {"enabled": bool(value)}
    return result


def collect_jobs(days_back=FETCH_DAYS):
    """Fetch each enabled feed once; a failed source does not stop the cycle."""
    from scrapers import arbeitnow_scraper
    from scrapers import remoteok_scraper
    from scrapers import remotive_scraper

    modules = {"remotive": remotive_scraper, "remoteok": remoteok_scraper, "arbeitnow": arbeitnow_scraper}
    settings = _source_settings()
    collected = []
    for name, module in modules.items():
        if not settings[name].get("enabled", True):
            continue
        try:
            kwargs = {"days_back": days_back}
            if name == "arbeitnow":
                page_setting = "backfill_max_pages" if days_back > FETCH_DAYS else "max_pages"
                default_pages = 50 if days_back > FETCH_DAYS else 20
                kwargs["max_pages"] = int(settings[name].get(page_setting, default_pages))
            collected.extend(module.scrape_all(**kwargs))
        except Exception as error:
            print(f"  [ERROR] {name} failed: {error}")

    print(f"  Sources total: {len(collected)} unclassified jobs")
    return collected


def _slugify(track):
    return track.lower().replace(" ", "_").replace("/", "_")


def _raw_path(track):
    return os.path.join(RAW_DIR, f"{_slugify(track)}_jobs.csv")


def _dedupe(df):
    if df.empty:
        return df
    df = df.copy()
    for column in BASE_COLUMNS:
        if column not in df:
            df[column] = ""
    track_key = df["track"].fillna("").astype(str) + ":"
    stable = track_key + df["source"].fillna("").astype(str) + ":" + df["source_job_id"].fillna("").astype(str)
    has_id = df["source_job_id"].fillna("").astype(str).str.len() > 0
    urls = df["url"].fillna("").astype(str).str.strip()
    has_url = urls.str.len() > 0
    fallback = (track_key + df["job_title"].fillna("").astype(str).str.lower().str.strip() + "|" + df["company"].fillna("").astype(str).str.lower().str.strip())
    df["_dedupe_key"] = stable.where(has_id, (track_key + urls).where(has_url, fallback))
    return df.drop_duplicates("_dedupe_key", keep="last").drop(columns="_dedupe_key").reset_index(drop=True)


def _update_history(classified_jobs):
    """Merge new rows and retain only jobs published during the last 60 days."""
    incoming = pd.DataFrame(classified_jobs)
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    existing = pd.read_csv(HISTORY_FILE) if os.path.exists(HISTORY_FILE) else pd.DataFrame(columns=BASE_COLUMNS)
    history = _dedupe(pd.concat([existing, incoming], ignore_index=True))
    if "published_at" not in history:
        history["published_at"] = history.get("date_collected", "")
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    published = pd.to_datetime(history["published_at"], errors="coerce", utc=True)
    before = len(history)
    history = history[published >= cutoff].reset_index(drop=True)
    history.to_csv(HISTORY_FILE, index=False)
    print(f"  Training history: dropped {before - len(history)} expired rows, stored {len(history)}")


def _load_cache():
    try:
        with open(CACHE_FILE) as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError):
        return {}


def _save_cache(cache):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CACHE_FILE, "w") as file:
        json.dump(cache, file, indent=2)


def scheduled_refresh(track, new_jobs=None, update_history=True):
    if track not in TRACK_KEYWORDS:
        raise ValueError(f"Unknown track: {track}")
    print(f"\nREFRESH: {track}")
    if new_jobs is None:
        classified = classify_jobs(collect_jobs(), track)
        if update_history:
            _update_history(classified)
    else:
        classified = [job for job in new_jobs if job.get("track") == track]

    path = _raw_path(track)
    existing = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame(columns=BASE_COLUMNS)
    if "published_at" not in existing:
        existing["published_at"] = existing.get("date_collected", "")
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    published = pd.to_datetime(existing["published_at"], errors="coerce", utc=True)
    before = len(existing)
    existing = existing[published >= cutoff]
    merged = _dedupe(pd.concat([existing, pd.DataFrame(classified)], ignore_index=True))
    # Both history and per-track outputs use the same 60-day window.
    merged_dates = pd.to_datetime(merged["published_at"], errors="coerce", utc=True)
    merged = merged[merged_dates >= cutoff].reset_index(drop=True)
    os.makedirs(RAW_DIR, exist_ok=True)
    merged.to_csv(path, index=False)
    print(f"  Rolling: dropped {before - len(existing)}, added {len(classified)}, stored {len(merged)}")

    cache = _load_cache()
    cache[track] = {"last_scraped_at": datetime.now(timezone.utc).isoformat(), "raw_file_path": path, "row_count": len(merged)}
    _save_cache(cache)
    result = run_pipeline_for_track(track)
    print(f"  Refresh complete for '{track}'")
    return result


def refresh_all_tracks(days_back=FETCH_DAYS):
    mode = f"BACKFILL {days_back} DAYS" if days_back > FETCH_DAYS else "REFRESH"
    print(f"\n{mode} ALL TRACKS — {datetime.now(timezone.utc).isoformat()}")
    classified = classify_jobs(collect_jobs(days_back=days_back))
    _update_history(classified)
    for track in TRACK_KEYWORDS:
        try:
            scheduled_refresh(track, classified, update_history=False)
        except Exception as error:
            print(f"  [ERROR] {track}: {error}")
    print(f"\nAll tracks refreshed at {datetime.now(timezone.utc).isoformat()}")


def _parse_args():
    parser = argparse.ArgumentParser(description="Refresh or backfill the job-data pipeline")
    parser.add_argument("target", help="'all' or one of the eight fixed track names")
    parser.add_argument(
        "--backfill-days", type=int, metavar="DAYS", default=FETCH_DAYS,
        help="fetch historical postings for DAYS; all outputs retain at most 60 days",
    )
    args = parser.parse_args()
    if args.backfill_days < FETCH_DAYS:
        parser.error(f"--backfill-days must be at least {FETCH_DAYS}")
    return args


if __name__ == "__main__":
    args = _parse_args()
    target = args.target
    if target == "all":
        refresh_all_tracks(days_back=args.backfill_days)
    elif target in TRACK_KEYWORDS:
        classified = classify_jobs(collect_jobs(days_back=args.backfill_days), target)
        _update_history(classified)
        scheduled_refresh(target, classified, update_history=False)
    else:
        print(f"Unknown track: {target}")
        sys.exit(2)
