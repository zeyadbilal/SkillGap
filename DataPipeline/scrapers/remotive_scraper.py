"""Remotive public API client (one request per refresh cycle)."""
import re
from datetime import datetime, timedelta, timezone
import requests

def _text(value):
    value = re.sub(r"<[^>]+>", " ", str(value or ""))
    return re.sub(r"\s+", " ", value).strip()

def scrape_all(days_back=2):
    response = requests.get("https://remotive.com/api/remote-jobs", params={"limit": 100}, timeout=30)
    response.raise_for_status()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    collected_at = datetime.now(timezone.utc).isoformat()
    jobs = []
    for item in response.json().get("jobs", []):
        try:
            published = datetime.fromisoformat(str(item.get("publication_date", "")).replace("Z", "+00:00"))
        except ValueError:
            continue
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        if published < cutoff:
            continue
        jobs.append({"source_job_id": str(item.get("id")), "job_title": _text(item.get("title")), "company": _text(item.get("company_name")) or "Unknown", "location": _text(item.get("candidate_required_location")) or "Remote", "description_text": _text(item.get("description")), "url": item.get("url") or "", "published_at": published.isoformat(), "date_collected": collected_at, "source": "remotive", "tags": item.get("tags") or []})
    print(f"  Remotive: {len(jobs)} recent jobs")
    return jobs
