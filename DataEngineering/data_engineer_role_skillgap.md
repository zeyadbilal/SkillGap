# Data Engineer Role — Skill Gap Project (Person C)

## Your job in one sentence
Turn messy job-posting text into a clean, structured dataset that the ML/forecasting team can actually use.

## Why this matters
The whole project depends on good input data. If the job postings aren't cleaned and structured properly, the skill-forecasting model and the CV-gap report will both produce garbage. Your part is the foundation everyone else builds on.

---

## Scope for the 3-day deadline (MVP only — don't expand this)

### Day 1 — Collect raw data
- Since scraping LinkedIn/Wuzzuf directly is legally risky, go with the safer approach: a simple manual-upload flow (a CSV/Excel template or a basic form) where users paste in job descriptions.
- Optional stretch (only if time allows): a small script that pulls public Wuzzuf listings for 1–2 categories (e.g. "Data", "DevOps") — nothing fancy, just enough to seed real data.
- Output: `raw_jobs.csv` — columns like `job_title, company, description_text, source, date_collected`.

### Day 2 — Clean the data
- Remove duplicates and empty/broken entries.
- Normalize text: strip HTML tags, extra whitespace, special characters, lowercase where useful.
- Extract skills from the free text using **simple keyword matching** against a predefined skills list per domain (e.g. a dictionary like `{"DevOps": ["docker","kubernetes","terraform","ansible","ci/cd",...], "Data": ["python","sql","etl","pandas",...]}`). No need for ML/NLP here — keyword matching is enough for the deadline.
- Output: `clean_jobs.csv` + `extracted_skills.csv` (job_id → list of skills found).

### Day 3 — Build the mini ETL pipeline + quality checks
- Wire Day 1 and Day 2 into one simple script/pipeline: `raw → clean → skills extracted`, runnable end-to-end with one command.
- Basic data quality checks (write these as simple functions, not a framework):
  - No missing `job_title` or `description_text`
  - No exact duplicate rows
  - Every row has at least 1 skill extracted (flag rows with 0 — they usually mean the extraction missed something)
- Write a short `README.md` explaining the folder/data schema so the ML teammate can plug in without asking you questions.
- Hand off `clean_jobs.csv` + `extracted_skills.csv` to whoever is building the forecasting model.

---

## Deliverables checklist
- [ ] `raw_jobs.csv` (or a manual-upload template if scraping isn't done)
- [ ] `clean.py` — cleaning + skill extraction script
- [ ] `quality_check.py` — the 3 checks above
- [ ] `clean_jobs.csv` + `extracted_skills.csv` (final output)
- [ ] `README.md` (schema + how to run)

## Explicitly OUT of scope (to stay realistic in 3 days)
- Scraping multiple sources or building a production-grade scraper
- Any ML/NLP model for skill extraction — keyword matching is enough
- Scheduling/orchestration tools (Airflow, cron jobs, etc.)
- A UI for uploading — a plain CSV template is fine for now

---

## Simple data schema (for reference)

**raw_jobs.csv**
| column | example |
|---|---|
| job_title | "Data Engineer" |
| company | "Company X" |
| description_text | "We are looking for..." |
| source | "manual_upload" / "wuzzuf" |
| date_collected | "2026-08-31" |

**extracted_skills.csv**
| column | example |
|---|---|
| job_id | 1 |
| skill | "ETL" |
| domain | "Data" |
