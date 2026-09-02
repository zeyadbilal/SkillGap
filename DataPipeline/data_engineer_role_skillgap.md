# Data Engineer Role — Skill Gap Project (Person C)

## Your job in one sentence
For each track in a **fixed set of 8 tracks**, keep a rolling 7-day window of fresh job-posting data from Wuzzuf automatically up to date (refreshed every 2 days in the background, not on user request), turn it into a clean structured dataset, extract skills, and return a skill-frequency count.

## Why this matters
The whole project depends on good input data. If the job postings aren't cleaned and structured properly, the skill-forecasting model and the CV-gap report will both produce garbage. Your part is the foundation everyone else builds on.

---

## Fixed track list (do NOT add tracks outside this list)

1. Backend Development
2. Frontend Development
3. Full-Stack Development
4. Mobile Development
5. DevOps & Cloud Engineering
6. Network Administration
7. Network Security
8. Machine Learning / AI

Build the pipeline generically (track name as a parameter), but only these 8 tracks are in scope. If the 3-day deadline doesn't allow seeding real data for all 8, seed 2–3 first and make sure the rest work with the same code path — don't design around a narrower or different list.

---

## NEW: Scheduled rolling refresh (every 2 days, per track) — replaces on-request caching

This is no longer "check staleness when a client asks for a track." The refresh now runs **on its own schedule**, in the background, independent of whether anyone requests the track. When a client asks for a track, they always get whatever is currently in the clean/skills output — they never trigger a scrape themselves.

**Why rolling, not full re-scrape:**
Each track keeps a **7-day window** of postings. Every 2 days:
- Don't wipe the whole 7-day window and re-scrape all 7 days again.
- Only scrape the **newest 2 days** of postings.
- Drop only the **oldest 2 days** from the stored window.
- The middle **5 days stay untouched** (shared/overlapping between the old and new window) — that's the 5-day overlap.

So the window slides forward by 2 days each cycle instead of being rebuilt from scratch.

**Cycle for one track, run automatically every 2 days:**

1. Scrape Wuzzuf for that track, but only the **last 2 days** of postings (not 7).
2. Load the track's existing stored raw data (if any).
3. Drop any stored rows older than 7 days from "now" (this removes the oldest ~2 days, keeping the 5-day overlap).
4. Append the newly scraped 2 days to what's left.
5. Deduplicate the merged set.
6. Save it back as the track's raw dataset, and update `last_scraped_at`.
7. Re-run the pipeline (clean → extract skills → frequency count) on the updated raw dataset.

A client requesting a track just reads the latest `clean_jobs_<track>.csv` / `skill_frequency_<track>.csv` — no scrape happens on their request.

**Example cache/metadata record:**
```json
{
  "Backend Development": {
    "last_scraped_at": "2026-08-31T10:00:00",
    "raw_file_path": "data/raw/backend_development_jobs.csv",
    "clean_file_path": "data/clean/backend_development_clean.csv",
    "skills_file_path": "data/skills/backend_development_skills.csv"
  },
  "Frontend Development": { "...": "..." }
}
```

**Rolling refresh pseudocode:**
```python
def scheduled_refresh(track):
    # Triggered by the scheduler every 2 days for every track — never by a user request.
    new_raw = scrape_wuzzuf(track, days_back=2)          # only the newest 2 days

    existing = load_raw(track)                            # may be None the first time
    if existing is not None:
        cutoff = now() - timedelta(days=7)
        existing = existing[existing["date_collected"] >= cutoff]  # drop oldest 2 days, keep 5-day overlap
        merged = concat(existing, new_raw)
    else:
        merged = new_raw                                   # first run for this track: seed with 2 days

    merged = dedupe(merged)
    save_raw(track, merged)
    update_cache(track, now())
    return run_pipeline(merged)                             # clean -> extract skills -> frequency count

def refresh_all_tracks():
    for track in FIXED_TRACKS:                              # the 8 tracks above
        scheduled_refresh(track)

def get_track_data(track):
    # What a client-facing request actually does: read the latest output, no scraping.
    return load_latest_outputs(track)
```

A simple scheduler (a loop with a sleep/interval check, or a basic cron entry calling `refresh_all_tracks()`) is enough — see the scope note below.

---

## Scope for the 3-day deadline (MVP only — don't expand this)

### Day 1 — Collect raw data (track-driven, rolling window)
- Build the Wuzzuf scraper for a track: given a track name from the fixed list, pull public Wuzzuf listings from the **last 2 days** matching that track (this is what the scheduled refresh calls each cycle).
- Implement the rolling-window merge logic above (drop rows older than 7 days, append new 2-day scrape, dedupe) instead of a full weekly re-scrape.
- Wrap it with a simple scheduler that calls `refresh_all_tracks()` every 2 days automatically — no manual trigger needed for normal operation.
- Keep the manual-upload CSV/Excel template as a fallback path (useful for testing, or tracks Wuzzuf doesn't cover well, or seeding the very first run before the scheduler has cycled).
- Output: `raw_jobs_<track>.csv` — columns like `job_title, company, description_text, source, date_collected, track`.

### Day 2 — Clean the data
- Remove duplicates and empty/broken entries.
- Normalize text: strip HTML tags, extra whitespace, special characters, lowercase where useful.
- Extract skills from the free text using **simple keyword matching** against a predefined skills list per domain (a dictionary keyed by the 8 fixed tracks, e.g. `{"Backend Development": ["node.js","django","rest api","postgresql",...], "DevOps & Cloud Engineering": ["docker","kubernetes","terraform","ansible","ci/cd",...], ...}`). No need for ML/NLP here — keyword matching is enough for the deadline.
- Output: `clean_jobs_<track>.csv` + `extracted_skills_<track>.csv` (job_id → list of skills found).

### Day 3 — Build the mini ETL pipeline + quality checks + skill frequency
- Wire everything into one script/pipeline: `scheduled refresh (rolling scrape) → clean → skills extracted → frequency count`, runnable end-to-end for one track via a `--track` argument (for testing/manual runs) and via `refresh_all_tracks()` for the real scheduled path.
- Basic data quality checks (write these as simple functions, not a framework):
  - No missing `job_title` or `description_text`
  - No exact duplicate rows
  - Every row has at least 1 skill extracted (flag rows with 0 — they usually mean the extraction missed something)
- **Final step**: aggregate `extracted_skills_<track>.csv` into a **skill frequency count** — how many times each skill appeared across all jobs currently in that track's 7-day window. Output: `skill_frequency_<track>.csv` with columns `skill, count`, sorted descending.
- Write a short `README.md` explaining the folder/data schema, the rolling-refresh mechanism, the fixed track list, and how to run it, so the ML teammate can plug in without asking you questions.
- Hand off `clean_jobs_<track>.csv`, `extracted_skills_<track>.csv`, and `skill_frequency_<track>.csv` to whoever is building the forecasting model.

---

## Deliverables checklist
- [ ] `wuzzuf_scraper.py` — track-based scraper (last 2 days per cycle)
- [ ] `refresh_pipeline.py` — the rolling-window merge logic (drop oldest 2 days, append newest 2 days, dedupe) + calls the clean/extract/frequency steps
- [ ] `scheduler.py` (or a cron entry) — calls `refresh_all_tracks()` every 2 days automatically
- [ ] `track_cache.json` (or equivalent) — tracks `last_scraped_at` per track, for the fixed 8-track list
- [ ] `raw_jobs_<track>.csv` (or manual-upload template as fallback / first-run seed)
- [ ] `clean.py` — cleaning + skill extraction script
- [ ] `quality_check.py` — the 3 checks above
- [ ] `clean_jobs_<track>.csv` + `extracted_skills_<track>.csv` (final output)
- [ ] `skill_frequency_<track>.csv` — skill counted-frequency output
- [ ] `README.md` (schema + rolling-refresh logic + fixed track list + how to run)

## Explicitly OUT of scope (to stay realistic in 3 days)
- Tracks outside the fixed list of 8 above
- Any ML/NLP model for skill extraction — keyword matching is enough
- Heavy scheduling/orchestration tools (Airflow, Celery beat, etc.) — a plain interval loop or a basic cron entry calling `refresh_all_tracks()` every 2 days is enough; this is now IN scope, just kept minimal
- A UI for uploading — a plain CSV template is fine as fallback
- A full database — a JSON cache file or a simple SQLite table is enough for the cache

---

## Important additions (do these regardless of time pressure)

These aren't optional extras — skipping them means the pipeline either breaks silently or produces output nobody else can use.

### 1. Build the actual skills dictionary
Day 2 mentions "keyword matching against a predefined skills list" — that list itself is the most important artifact you'll produce, because the whole extraction step depends on it. Don't leave it vague:
- Draft an initial version: ~30–50 keywords per track, for each of the 8 fixed tracks.
- Get quick feedback from whoever is building the forecasting model — they need to trust this list, since bad keywords = bad forecasts downstream.
- Keep it in its own file (e.g. `skills_dictionary.json`) so it's easy to update without touching the pipeline code.

### 2. Add simple logging to the pipeline
A couple of printed lines each refresh cycle: which track was refreshed, how many rows were dropped for being outside the 7-day window, how many new rows were scraped, how many rows were cleaned, how many were dropped, how many postings ended up with zero extracted skills. This isn't complex — it just needs to exist. It catches bugs immediately and shows the pipeline is behaving as expected.

### 3. Create a small test dataset before real data is ready
Write 3–5 fake job postings by hand (for at least one track) and run `clean.py` / `quality_check.py` against them from day one. Don't wait on the scraper to be finished to test the cleaning code — building the test set in parallel saves rework on Day 3.

### 4. Confirm the output format with the ML teammate early
Before finalizing `extracted_skills_<track>.csv` and `skill_frequency_<track>.csv`, check how the forecasting model actually expects skills per job and per track — a list column, one-hot encoded columns, raw counts, normalized frequencies, etc. Confirming this early avoids reshaping the output under time pressure on the last day.

---

## Simple data schema (for reference)

**raw_jobs_<track>.csv**
| column | example |
|---|---|
| job_title | "Backend Developer" |
| company | "Company X" |
| description_text | "We are looking for..." |
| source | "wuzzuf" / "manual_upload" |
| date_collected | "2026-08-31" |
| track | "Backend Development" |

**extracted_skills_<track>.csv**
| column | example |
|---|---|
| job_id | 1 |
| skill | "REST API" |
| domain | "Backend Development" |

**skill_frequency_<track>.csv**
| column | example |
|---|---|
| skill | "Docker" |
| count | 27 |

**track_cache.json**
| field | example |
|---|---|
| track | "DevOps & Cloud Engineering" |
| last_scraped_at | "2026-08-31T10:00:00" |
| raw_file_path | "data/raw/devops_and_cloud_engineering_jobs.csv" |
