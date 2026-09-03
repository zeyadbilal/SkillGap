"""Arbeitnow public, paginated job-feed client."""
import re
from datetime import datetime, timedelta, timezone
import requests

API_URL = "https://www.arbeitnow.com/api/job-board-api"

def _text(value):
    value = re.sub(r"<[^>]+>", " ", str(value or ""))
    return re.sub(r"\s+", " ", value).strip()

def _published(value):
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None

def scrape_all(days_back=2, max_pages=5):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    collected_at = datetime.now(timezone.utc).isoformat()
    jobs = []
    for page in range(1, max_pages + 1):
        response = requests.get(API_URL, params={"page": page}, timeout=30)
        response.raise_for_status()
        payload = response.json()
        rows = payload.get("data") or []
        valid_dates = []
        for item in rows:
            published = _published(item.get("created_at"))
            if not published:
                continue
            valid_dates.append(published)
            if published < cutoff:
                continue
            slug = str(item.get("slug") or "")
            jobs.append({"source_job_id": slug, "job_title": _text(item.get("title")), "company": _text(item.get("company_name")) or "Unknown", "location": _text(item.get("location")), "description_text": _text(item.get("description")), "url": item.get("url") or (f"https://www.arbeitnow.com/view/{slug}" if slug else ""), "published_at": published.isoformat(), "date_collected": collected_at, "source": "arbeitnow", "tags": item.get("tags") or []})
        page_is_entirely_old = bool(valid_dates) and all(date < cutoff for date in valid_dates)
        if page_is_entirely_old or not payload.get("links", {}).get("next"):
            break
    print(f"  Arbeitnow: {len(jobs)} recent jobs")
    return jobs
