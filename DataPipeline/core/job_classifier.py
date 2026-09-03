"""Shared track definitions and lightweight job-to-track classification."""
import re

TRACK_KEYWORDS = {
    "Backend Development": ["backend", "back-end", "server-side", "node.js", "django", "flask", "fastapi", "spring boot", ".net", "golang"],
    "Frontend Development": ["frontend", "front-end", "react", "angular", "vue", "javascript", "typescript", "web developer", "ui developer"],
    "Full-Stack Development": ["full stack", "full-stack", "fullstack", "mern", "mean stack"],
    "Mobile Development": ["mobile developer", "android", "ios developer", "react native", "flutter", "swift", "kotlin"],
    "DevOps & Cloud Engineering": ["devops", "cloud engineer", "site reliability", "sre", "kubernetes", "terraform", "aws engineer", "azure engineer", "platform engineer"],
    "Network Administration": ["network administrator", "network engineer", "network operations", "cisco", "lan", "wan", "network infrastructure"],
    "Network Security": ["network security", "cybersecurity", "cyber security", "security engineer", "soc analyst", "penetration tester", "infosec"],
    "Machine Learning / AI": ["machine learning", "artificial intelligence", "ai engineer", "ml engineer", "data scientist", "deep learning", "nlp", "computer vision", "llm"],
}

def _contains(text, keyword):
    return re.search(r"(?<!\w)" + re.escape(keyword) + r"(?!\w)", text) is not None

def job_matches_track(job, track):
    keywords = TRACK_KEYWORDS[track]
    title = str(job.get("job_title") or "").lower()
    description = str(job.get("description_text") or "").lower()
    tags = " ".join(str(tag) for tag in (job.get("tags") or [])).lower()
    if any(_contains(title, keyword) for keyword in keywords):
        return True
    return sum(_contains(f"{description} {tags}", keyword) for keyword in keywords) >= 2

def classify_jobs(jobs, track=None):
    tracks = [track] if track else list(TRACK_KEYWORDS)
    classified = []
    for job in jobs:
        explicit_track = job.get("track")
        if explicit_track in TRACK_KEYWORDS:
            if track is None or track == explicit_track:
                row = dict(job)
                row.pop("tags", None)
                classified.append(row)
            continue
        for current_track in tracks:
            if job_matches_track(job, current_track):
                row = dict(job)
                row.pop("tags", None)
                row["track"] = current_track
                classified.append(row)
    return classified
