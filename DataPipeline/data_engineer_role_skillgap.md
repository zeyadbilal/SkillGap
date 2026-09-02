# Data Engineer Role — Skill Gap Project (Person C)

## Your job in one sentence
Given a track the client picks (DevOps, Data, Embedded Systems, etc.), pull fresh job-posting data for that track from Wuzzuf, turn it into a clean structured dataset, extract skills, and return a skill-frequency count — while caching per track so you don't re-scrape unnecessarily.

## Why this matters
The whole project depends on good input data. If the job postings aren't cleaned and structured properly, the skill-forecasting model and the CV-gap report will both produce garbage. Your part is the foundation everyone else builds on.

---

## NEW: Track-based scraping with a 2-day cache

This replaces the old "manual upload only" flow. The pipeline is now on-demand, keyed by track.

**Flow when a client requests a track (e.g. "DevOps"):**

1. Look up the track in a small **cache/metadata store** (a simple table or JSON file is enough — e.g. `track_cache.json` or a `track_meta` table with columns `track, last_scraped_at, raw_file_path`).
2. **If the track has never been scraped**, or **`last_scraped_at` is more than 2 days ago** → trigger a fresh Wuzzuf scrape for that track (jobs from the last week), save the raw results, update `last_scraped_at` to now.
3. **If `last_scraped_at` is within the last 2 days** → skip scraping, serve the existing cached data for that track straight into the cleaning step.
4. Either way, the client always ends up with clean data + skills for their track — they just don't know (or care) whether it was scraped just now or served from cache.
5. Every track is cached independently. Two different clients asking for "DevOps" within the same 2-day window both get the same cached run — no duplicate scraping.

**Example cache record:**
```json
{
  "DevOps": {
    "last_scraped_at": "2026-08-31T10:00:00",
    "raw_file_path": "data/raw/devops_jobs.csv",
    "clean_file_path": "data/clean/devops_clean.csv",
    "skills_file_path": "data/skills/devops_skills.csv"
  },
  "Data": { "...": "..." }
}
```

**Simple freshness check (pseudocode):**
```python
def get_track_data(track):
    meta = load_cache(track)
    if meta is None or (now() - meta["last_scraped_at"]) > timedelta(days=2):
        raw = scrape_wuzzuf(track, days_back=7)
        save_raw(track, raw)
        update_cache(track, now())
    else:
        raw = load_raw(track)   # cached, no scrape
    return run_pipeline(raw)     # clean -> extract skills -> frequency count
```

This means the scraper only runs when the cache is stale for that specific track — everything else in the pipeline (cleaning, extraction, quality checks) runs every time on whatever raw data it's handed, cached or fresh.

---

## Scope for the 3-day deadline (MVP only — don't expand this)

### Day 1 — Collect raw data (now track-driven)
- Build the Wuzzuf scraper for a track: given a track name, pull public Wuzzuf listings from the **last 7 days** matching that track (start with 1–2 tracks like "DevOps" and "Data", expand if time allows).
- Wrap it with the caching logic above (`track_cache.json` + the 2-day check) so repeat requests for the same track don't re-scrape.
- Keep the manual-upload CSV/Excel template as a fallback path (useful for testing, or tracks Wuzzuf doesn't cover well).
- Output: `raw_jobs_<track>.csv` — columns like `job_title, company, description_text, source, date_collected, track`.

### Day 2 — Clean the data
- Remove duplicates and empty/broken entries.
- Normalize text: strip HTML tags, extra whitespace, special characters, lowercase where useful.
- Extract skills from the free text using **simple keyword matching** against a predefined skills list per domain (e.g. a dictionary like `{"DevOps": ["docker","kubernetes","terraform","ansible","ci/cd",...], "Data": ["python","sql","etl","pandas",...]}`). No need for ML/NLP here — keyword matching is enough for the deadline.
- Output: `clean_jobs_<track>.csv` + `extracted_skills_<track>.csv` (job_id → list of skills found).

### Day 3 — Build the mini ETL pipeline + quality checks + skill frequency
- Wire everything into one script/pipeline: `get track → (scrape if stale / load cache) → clean → skills extracted → frequency count`, runnable end-to-end with one command and a `--track` argument.
- Basic data quality checks (write these as simple functions, not a framework):
  - No missing `job_title` or `description_text`
  - No exact duplicate rows
  - Every row has at least 1 skill extracted (flag rows with 0 — they usually mean the extraction missed something)
- **New final step**: aggregate `extracted_skills_<track>.csv` into a **skill frequency count** — how many times each skill appeared across all jobs in that track. Output: `skill_frequency_<track>.csv` with columns `skill, count`, sorted descending.
- Write a short `README.md` explaining the folder/data schema, the cache mechanism, and how to run it, so the ML teammate can plug in without asking you questions.
- Hand off `clean_jobs_<track>.csv`, `extracted_skills_<track>.csv`, and `skill_frequency_<track>.csv` to whoever is building the forecasting model.

---

## Deliverables checklist
- [ ] `wuzzuf_scraper.py` — track-based scraper (last 7 days) with the 2-day cache check
- [ ] `track_cache.json` (or equivalent) — tracks `last_scraped_at` per track
- [ ] `raw_jobs_<track>.csv` (or manual-upload template as fallback)
- [ ] `clean.py` — cleaning + skill extraction script
- [ ] `quality_check.py` — the 3 checks above
- [ ] `clean_jobs_<track>.csv` + `extracted_skills_<track>.csv` (final output)
- [ ] `skill_frequency_<track>.csv` — skill counted-frequency output
- [ ] `README.md` (schema + cache logic + how to run)

## Explicitly OUT of scope (to stay realistic in 3 days)
- Scraping every track/category at once — build it generically but only test/seed 1–2 tracks
- Any ML/NLP model for skill extraction — keyword matching is enough
- Scheduling/orchestration tools (Airflow, cron jobs, etc.) — the "2-day staleness check" happens inline when a track is requested, not on a background schedule
- A UI for uploading — a plain CSV template is fine as fallback
- A full database — a JSON cache file or a simple SQLite table is enough for the cache

---

## Important additions (do these regardless of time pressure)

These aren't optional extras — skipping them means the pipeline either breaks silently or produces output nobody else can use.

### 1. Build the actual skills dictionary
Day 2 mentions "keyword matching against a predefined skills list" — that list itself is the most important artifact you'll produce, because the whole extraction step depends on it. Don't leave it vague:
- Draft an initial version: ~30–50 keywords per domain (e.g. DevOps, Data, Embedded Systems).
- Get quick feedback from whoever is building the forecasting model — they need to trust this list, since bad keywords = bad forecasts downstream.
- Keep it in its own file (e.g. `skills_dictionary.json`) so it's easy to update without touching the pipeline code.

### 2. Add simple logging to the pipeline
A couple of printed lines each run: which track was requested, whether it scraped fresh or served from cache, how many rows were cleaned, how many were dropped, how many postings ended up with zero extracted skills. This isn't complex — it just needs to exist. It catches bugs immediately and shows the pipeline is behaving as expected.

### 3. Create a small test dataset before real data is ready
Write 3–5 fake job postings by hand (for at least one track) and run `clean.py` / `quality_check.py` against them from day one. Don't wait on the scraper to be finished to test the cleaning code — building the test set in parallel saves rework on Day 3.

### 4. Confirm the output format with the ML teammate early
Before finalizing `extracted_skills_<track>.csv` and `skill_frequency_<track>.csv`, check how the forecasting model actually expects skills per job and per track — a list column, one-hot encoded columns, raw counts, normalized frequencies, etc. Confirming this early avoids reshaping the output under time pressure on the last day.

---

## Simple data schema (for reference)

**raw_jobs_<track>.csv**
| column | example |
|---|---|
| job_title | "Data Engineer" |
| company | "Company X" |
| description_text | "We are looking for..." |
| source | "wuzzuf" / "manual_upload" |
| date_collected | "2026-08-31" |
| track | "Data" |

**extracted_skills_<track>.csv**
| column | example |
|---|---|
| job_id | 1 |
| skill | "ETL" |
| domain | "Data" |

**skill_frequency_<track>.csv**
| column | example |
|---|---|
| skill | "Docker" |
| count | 27 |

**track_cache.json**
| field | example |
|---|---|
| track | "DevOps" |
| last_scraped_at | "2026-08-31T10:00:00" |
| raw_file_path | "data/raw/devops_jobs.csv" |
