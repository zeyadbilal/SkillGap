# DataPipeline — Skill Gap Project

## What this is

An automated data pipeline that answers one question on a rolling basis: **"what skills are currently in demand for each of 8 tech tracks?"**

It does this by:
1. Pulling live job postings from public, no-auth-required job-board APIs.
2. Classifying each posting into exactly one of 8 fixed technology tracks (Backend, Frontend, etc.).
3. Keeping a rolling **60-day training window** per track — old postings age out automatically, new ones are added every refresh.
4. Cleaning the text and matching it against a hand-curated keyword dictionary to extract which skills each posting mentions.
5. Aggregating those matches into per-track skill-frequency counts — the actual "skill gap" signal consumed downstream (e.g. by the `backend`/`frontend` apps in this repo).

Nothing in here needs credentials, a database, or a queue. It's plain Python + `pandas`, reading/writing CSV and JSON files on disk, meant to be re-run on a schedule (`scripts/scheduler.py`) or manually (`scripts/refresh_pipeline.py`).

## The 8 fixed tracks

Defined once in `core/job_classifier.py::TRACK_KEYWORDS` and reused everywhere else (scripts, cleaning, dictionaries all key off these exact strings — rename a track in one place and every other place must match exactly, since matching is a plain dict lookup, not fuzzy).

| # | Track (exact string used everywhere) | Classification keywords (`TRACK_KEYWORDS`) |
|---|---|---|
| 1 | Backend Development | backend, back-end, server-side, node.js, django, flask, fastapi, spring boot, .net, golang |
| 2 | Frontend Development | frontend, front-end, react, angular, vue, javascript, typescript, web developer, ui developer |
| 3 | Full-Stack Development | full stack, full-stack, fullstack, mern, mean stack |
| 4 | Mobile Development | mobile developer, android, ios developer, react native, flutter, swift, kotlin |
| 5 | DevOps & Cloud Engineering | devops, cloud engineer, site reliability, sre, kubernetes, terraform, aws engineer, azure engineer, platform engineer |
| 6 | Network Administration | network administrator, network engineer, network operations, cisco, lan, wan, network infrastructure |
| 7 | Network Security | network security, cybersecurity, cyber security, security engineer, soc analyst, penetration tester, infosec |
| 8 | Machine Learning / AI | machine learning, artificial intelligence, ai engineer, ml engineer, data scientist, deep learning, nlp, computer vision, llm |

These are the keywords used only to **classify a job into a track** (matched against title/description/tags). The much larger, separate `config/skills_dictionary.json` (34–53 entries per track) is what's used afterward to **extract individual skills** from jobs already assigned to a track — the two lists serve different purposes and are not meant to be identical.

### How classification actually decides — worked example

`job_matches_track(job, track)` in `core/job_classifier.py`:
- If **any** keyword appears in the job **title** → match, immediately, on that one hit alone.
- Otherwise, count keyword hits across `description + tags` combined → match only if **2 or more** hits land (a single incidental mention isn't enough signal on its own).

Example: a posting titled *"Software Engineer"* (no track keyword in the title) whose description mentions *"...experience with **kubernetes** and **docker**, working with our **devops** team..."* matches **DevOps & Cloud Engineering** because it clears the 2-hit threshold (`kubernetes` + `devops`; `docker` isn't itself a DevOps keyword but doesn't need to be). A posting titled *"Backend Engineer"* matches **Backend Development** instantly on the title hit, regardless of what the description says.

A job that clears none of the 8 thresholds matches **no track** and is silently dropped by `classify_jobs()` — it never reaches `history/all_jobs.csv` or any per-track file.

## Data sources

| Source | Module | Notes |
|---|---|---|
| [Remotive](https://remotive.com) | `scrapers/remotive_scraper.py` | Single-page public API, up to 100 jobs/request |
| [Remote OK](https://remoteok.com) | `scrapers/remoteok_scraper.py` | Single-request public JSON feed; attribution + original links retained |
| [Arbeitnow](https://www.arbeitnow.com) | `scrapers/arbeitnow_scraper.py` | Paginated public API; attribution + original links retained |

Each source is fetched **once per refresh cycle**. A failed source is caught, logged, and skipped — it never stops the other sources or the rolling-window bookkeeping (see `collect_jobs()` in `scripts/refresh_pipeline.py`).

## Folder-by-folder

```text
DataPipeline/
  README.md                  # this file
  requirements.txt           # pinned-free list of third-party Python packages
  .gitignore                 # keeps caches and the local config.json out of git
  config/
    config.json               # ACTUAL settings the pipeline reads (gitignored)
    config.example.json       # committed template — copy this to create config.json
    skills_dictionary.json    # per-track keyword lists used for skill extraction
  core/
    clean.py                  # text cleaning + skill extraction + frequency counting
    job_classifier.py         # the 8 track definitions + job-to-track classification logic
    quality_check.py          # sanity/validation checks on the clean + skills outputs
  scrapers/
    remotive_scraper.py       # Remotive API client
    remoteok_scraper.py       # Remote OK API client
    arbeitnow_scraper.py      # Arbeitnow API client (paginated)
  scripts/
    refresh_pipeline.py       # entry point: collect -> classify -> roll window -> clean -> extract
    scheduler.py              # entry point: calls refresh_pipeline every 7 days, forever
  tests/
    test_pipeline_regressions.py  # regression tests covering the trickiest logic
  data/
    history/all_jobs.csv       # de-duplicated, all-tracks rolling history (60-day window)
    raw/<track>_jobs.csv        # per-track raw rows, rolling 60-day window
    clean/<track>_clean.csv     # per-track cleaned rows (empty title/description dropped, deduped)
    skills/<track>_skills.csv     # per-track extracted (job_id, skill, domain) rows
    skills/<track>_frequency.csv  # per-track (skill, count) sorted by count desc
    track_cache.json           # bookkeeping: last_scraped_at / raw_file_path / row_count per track
```

### `config/` — settings and reference data

- **`config.json`** — the file the code actually reads. Toggles which sources are enabled and Arbeitnow's pagination limits. Gitignored on purpose (see the note below on why it's separate from `config.example.json`).
- **`config.example.json`** — the checked-in template. New setups do `cp config/config.example.json config/config.json` and edit from there. Anyone can see the expected shape without any local, possibly-customized settings leaking into git.
- **`skills_dictionary.json`** — the ground truth for skill extraction. One key per track, each mapping to a list of lowercase skill keywords. `core/clean.py::extract_skills()` does whole-word matching of these against each job's cleaned description. **This is the file to edit when you want to track a new skill or fix a false match** — no code change needed.

  | Track | Skill count | First few keywords |
  |---|---|---|
  | Backend Development | 47 | node.js, express.js, django, flask, fastapi |
  | Frontend Development | 44 | javascript, typescript, html, css, sass |
  | Full-Stack Development | 40 | node.js, express.js, react, next.js, vue.js |
  | Mobile Development | 34 | react native, flutter, swift, kotlin, dart |
  | DevOps & Cloud Engineering | 48 | docker, kubernetes, terraform, ansible, puppet |
  | Network Administration | 35 | cisco, ccna, ccnp, switching, routing |
  | Network Security | 38 | firewall, ids, ips, siem, soc |
  | Machine Learning / AI | 53 | python, r, java, scala, tensorflow |

#### `config.json` schema

```json
{
  "sources": {
    "remotive":  { "enabled": true },
    "remoteok":  { "enabled": true },
    "arbeitnow": { "enabled": true, "max_pages": 20, "backfill_max_pages": 50 }
  }
}
```

| Key | Applies to | Default if key/file is missing | Meaning |
|---|---|---|---|
| `sources.remotive.enabled` | Remotive | `true` | skip this source entirely when `false` |
| `sources.remoteok.enabled` | Remote OK | `true` | skip this source entirely when `false` |
| `sources.arbeitnow.enabled` | Arbeitnow | `true` | skip this source entirely when `false` |
| `sources.arbeitnow.max_pages` | Arbeitnow, normal 7-day refresh | `20` | hard cap on pages fetched per refresh |
| `sources.arbeitnow.backfill_max_pages` | Arbeitnow, `--backfill-days` run | `50` | hard cap on pages fetched during a backfill |

If `config.json` is missing entirely, deleted, or fails to parse, `_load_config()` in `scripts/refresh_pipeline.py` silently falls back to `{}`, which resolves to all three sources enabled with the defaults above — the pipeline degrades gracefully rather than crashing on a bad/missing config file.

### `core/` — the pure logic (no network calls)

- **`job_classifier.py`**
  - `TRACK_KEYWORDS`: the single source of truth for the 8 track names and the keywords used to detect them.
  - `job_matches_track(job, track)`: a job matches a track if any keyword hits the **title**, OR at least 2 keyword hits land across `description + tags` combined (title match alone is decisive; description/tags need corroborating signal to avoid noisy false positives).
  - `classify_jobs(jobs, track=None)`: runs every job through every track (or just one, if `track` is given). Respects an explicit `job["track"]` if the caller already knows it (used to avoid re-classifying jobs pulled from an existing per-track cache).
- **`clean.py`**
  - `load_skills_dictionary()`: reads and lowercases `config/skills_dictionary.json`.
  - `normalize_text()`: strips HTML tags, strips anything that isn't alphanumeric/`+#./-`, collapses whitespace, lowercases. This is what skill matching runs against.
  - `clean_jobs(raw_df)`: drops rows with an empty title or description, de-dupes on `(job_title, company, description_text)`, resets the index.
  - `extract_skills(clean_df, track, skills_dict)`: for every cleaned row, regex-matches every dictionary keyword for that track as a whole word (`\bskill\b`) against the normalized description. Produces one `(job_id, skill, domain)` row per match. `job_id` is built to stay **stable across reruns and row-order changes**: `"<source>:<source_job_id>"` if available, else the URL, else a deterministic SHA-256 hash of `source|title|company` — this is what makes joins against `skills.csv` reliable even after re-scraping.
  - `compute_skill_frequency(extracted_df)`: `value_counts()` on the skill column, sorted descending — this is the final "what's in demand" output.
  - `run_pipeline_for_track(track)`: orchestrates the three steps above for one track and writes `clean/<track>_clean.csv`, `skills/<track>_skills.csv`, `skills/<track>_frequency.csv`. Also runnable standalone: `python core/clean.py "Backend Development"`.
- **`quality_check.py`**
  - `check_clean_file(track)`: fails if any row is missing `job_title`/`description_text`, or if exact duplicates slipped through.
  - `check_skills_file(track)`: warns (doesn't fail the run) if some percentage of jobs matched zero skills — a normal, expected occurrence for live scraped data, not necessarily a bug.
  - `run_checks(track)`: runs both and prints a PASS/WARN/FAIL summary. Runnable standalone: `python core/quality_check.py "Backend Development"`.

### `scrapers/` — network I/O, one module per source

Each scraper exposes a single `scrape_all(days_back=...)` function (Arbeitnow also takes `max_pages`) and returns a **list of plain dicts** in a common shape: `source_job_id, job_title, company, location, description_text, url, published_at, date_collected, source, tags`. This common shape is what lets `refresh_pipeline.py` merge all three sources without source-specific handling downstream.

- **`remotive_scraper.py`** — one GET request, up to 100 jobs, filters to postings published within `days_back`.
- **`remoteok_scraper.py`** — one GET request against the full public feed, same recency filter; sends a `User-Agent` header since the feed expects one.
- **`arbeitnow_scraper.py`** — paginates (`max_pages`, default caps of 20 for normal refreshes / 50 for backfills, both configurable in `config.json`) and stops early once a page comes back entirely older than the cutoff, or when the API reports no next page. A single invalid `created_at` on a page doesn't stop the rest of that page or later pages from being processed (regression-tested).

### `scripts/` — the two things you actually run

- **`refresh_pipeline.py`** — the real entry point:
  - `collect_jobs(days_back)`: calls the three scrapers (skipping any disabled in `config.json`), swallows per-source exceptions.
  - `_update_history(classified)`: merges new rows into `data/history/all_jobs.csv`, de-dupes, drops anything with `published_at` older than 60 days.
  - `scheduled_refresh(track, ...)`: same rolling-window merge/dedupe/expire logic but scoped to one track's `data/raw/<track>_jobs.csv`, then calls `core.clean.run_pipeline_for_track(track)` and updates `data/track_cache.json`.
  - `refresh_all_tracks(days_back)`: does the above for all 8 tracks in one pass. This is what `scheduler.py` calls.
  - CLI: `target` is either `all` or one exact track name (anything else prints `Unknown track: <target>` and exits with code `2`); `--backfill-days N` must be `>= 7` (`FETCH_DAYS`) or argparse rejects it with a usage error before anything runs.
  - Note: this file inserts the `DataPipeline` root onto `sys.path` at import time so `core.*` and `scrapers.*` resolve correctly no matter where it's invoked from.
- **`scheduler.py`** — a deliberately simple loop: `while True: refresh_all_tracks(); sleep(REFRESH_INTERVAL_SECONDS)`, where `REFRESH_INTERVAL_SECONDS = 7 * 24 * 60 * 60` (604,800 seconds / 7 days), imported straight from `refresh_pipeline.refresh_all_tracks`. If a refresh raises, the exception is caught, printed, and the loop still sleeps and retries on the next cycle — one bad cycle never kills the process. All output goes to stdout only (`print`, no log file), so if you run this unattended, redirect stdout somewhere you'll actually see it. No cron, no external scheduler dependency — just run it and leave it running (e.g. under `pm2`, `systemd`, a container, or a `screen`/`tmux` session).

### `tests/`

`test_pipeline_regressions.py` — regression tests for the logic most likely to silently break: dedupe fallback when both `source_job_id` and `url` are missing, `job_id` stability across row-order changes, respecting an explicitly pre-set `track` instead of re-classifying, and Arbeitnow pagination surviving one bad `created_at` value. Run with:

```bash
python -m unittest discover -s tests -v
```

### `data/` — everything generated at runtime

Nothing under `data/` is hand-written; it's all produced by `scripts/refresh_pipeline.py` and `core/clean.py`. Current per-track file naming is the lowercased, `_`-joined track name, e.g. `Full-Stack Development` → `full-stack_development_jobs.csv`, `Machine Learning / AI` → `machine_learning___ai_jobs.csv`.

- `history/all_jobs.csv` — every track's rows in one file, the master rolling history.
- `raw/<track>_jobs.csv` — that track's slice, rolling 60 days, before cleaning.
- `clean/<track>_clean.csv` — after `clean_jobs()`: empty rows dropped, exact duplicates removed.
- `skills/<track>_skills.csv` — one row per `(job_id, skill)` match.
- `skills/<track>_frequency.csv` — `(skill, count)`, sorted descending — the headline output.
- `track_cache.json` — one entry per track: `last_scraped_at`, `raw_file_path`, `row_count`. Bookkeeping only, not consumed by the pipeline logic itself.

#### Exact CSV columns (verified against real generated files)

`history/all_jobs.csv`, `raw/<track>_jobs.csv`, and `clean/<track>_clean.csv` all share the same 10 columns (`BASE_COLUMNS` in `scripts/refresh_pipeline.py`):

```
source_job_id, job_title, company, location, description_text, url, published_at, date_collected, source, track
```

`skills/<track>_skills.csv` has 3 columns: `job_id, skill, domain` (`domain` is always the track name). Real example row:

```
job_id,skill,domain
arbeitnow:senior-software-engineer-windows-desktop-applications-cologne-germany-423898,ci/cd,Backend Development
```

`skills/<track>_frequency.csv` has 2 columns: `skill, count`. Real example:

```
skill,count
ci/cd,31
kubernetes,30
docker,29
```

Row counts vary every refresh since the data is live — as a snapshot from an actual local test run, `history/all_jobs.csv` held 370 data rows across all 8 tracks combined, with per-track raw counts ranging from 3 (Network Administration, the smallest niche) to 87 (Frontend Development, the largest).

## Setup

```bash
cd DataPipeline
pip install -r requirements.txt
cp config/config.example.json config/config.json
```

No credentials are needed for the default sources. Edit `config/config.json` to disable feeds or change Arbeitnow pagination (`max_pages` for normal refreshes, `backfill_max_pages` for backfills).

## Usage

```bash
python scripts/refresh_pipeline.py all
python scripts/refresh_pipeline.py all --backfill-days 60
python scripts/refresh_pipeline.py "Backend Development"
python core/clean.py "Backend Development"
python core/quality_check.py "Backend Development"
python -m unittest discover -s tests -v
python scripts/scheduler.py
```

`--backfill-days 60` performs the initial historical seed. Normal refreshes then fetch the newest seven days and remove jobs older than 60 days. Arbeitnow uses `backfill_max_pages` from `config/config.json` (50 by default) during the initial operation.

## Runtime characteristics (measured, not estimated)

- **Dependencies**: only `pandas` and `requests` are third-party; everything else (`os`, `re`, `json`, `hashlib`, `sys`, `time`, `argparse`, `datetime`, `unittest`) is Python standard library. Verified by grepping every `import`/`from` line in the codebase against `requirements.txt`.
- **Python version**: developed and verified against Python 3.13.5; nothing in the code (f-strings, `datetime.fromisoformat`, `pathlib`-free `os.path` usage) requires newer than Python 3.8+.
- **`python scripts/refresh_pipeline.py all`**: a real, live run (all 3 sources enabled, default page limits) completed in **~13.5 seconds** end to end — collect from all 3 sources, classify, roll the history window, then clean + extract + count for all 8 tracks. Almost all of that time is network I/O — the local classify/clean/extract work for all 8 tracks combined took about 1.3 seconds, measured from the `last_scraped_at` timestamp spread across all 8 entries in `data/track_cache.json` after the same run.
- **`python -m unittest discover -s tests -v`**: all 4 tests complete in **under 10ms** — they use mocked HTTP responses and in-memory DataFrames, no network or disk I/O beyond what's already on disk, so the suite is safe to run frequently.
- **`python core/quality_check.py "<track>"`**: reads only that track's already-generated `clean/` and `skills/` CSVs — instantaneous, no network call.

## Refresh behavior, step by step

1. Fetch jobs published during the newest seven days, or 60 days during the initial backfill.
2. Normalize and classify them locally into the fixed tracks (`core/job_classifier.py`).
3. Merge them into `data/history/all_jobs.csv` and the corresponding `data/raw/<track>_jobs.csv`.
4. Remove jobs whose `published_at` is older than 60 days (both history and per-track files, same cutoff).
5. Deduplicate, clean (`core/clean.py::clean_jobs`), extract skills (`extract_skills`), and recompute frequencies (`compute_skill_frequency`) over the retained window.

Deduplication prefers `(track, source, source_job_id)`, then track + URL, then a track + normalized-title/company fallback — see `_dedupe()` in `scripts/refresh_pipeline.py`.

## Extending the pipeline

- **Track a new skill / fix a false match** → edit `config/skills_dictionary.json` only. No code change, no restart logic needed beyond the next refresh (or re-run `core/clean.py <track>` against existing raw data to reprocess immediately).
- **Add a new job source** → add a `scrapers/<name>_scraper.py` exposing `scrape_all(days_back=...)` returning the common dict shape, register it in the `modules` dict inside `collect_jobs()` in `scripts/refresh_pipeline.py`, and add a `"<name>": {"enabled": true}` default to `DEFAULT_SOURCES`.
- **Add a new track** → add it to `TRACK_KEYWORDS` in `core/job_classifier.py` and add a matching key to `config/skills_dictionary.json`. Everything else (file naming, rolling window, quality checks) is generic over the track name.
