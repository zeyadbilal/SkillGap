"""Remote OK public JSON-feed client."""
import re
from datetime import datetime, timedelta, timezone
import requests

API_URL = "https://remoteok.com/api"

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

def scrape_all(days_back=2):
    response = requests.get(API_URL, headers={"User-Agent": "SkillGapResearchPipeline/1.0"}, timeout=30)
    response.raise_for_status()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    collected_at = datetime.now(timezone.utc).isoformat()
    jobs = []
    for item in response.json():
        if not isinstance(item, dict) or not item.get("id"):
            continue
        published = _published(item.get("epoch") or item.get("date"))
        if not published or published < cutoff:
            continue
        jobs.append({"source_job_id": str(item["id"]), "job_title": _text(item.get("position")), "company": _text(item.get("company")) or "Unknown", "location": _text(item.get("location")) or "Remote", "description_text": _text(item.get("description")), "url": item.get("url") or item.get("apply_url") or "", "published_at": published.isoformat(), "date_collected": collected_at, "source": "remoteok", "tags": item.get("tags") or []})
    print(f"  Remote OK: {len(jobs)} recent jobs")
    return jobs
