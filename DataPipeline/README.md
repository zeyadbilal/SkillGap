# SkillGap Data Pipeline

Automated, self-refreshing job-posting pipeline for the SkillGap project. It keeps a rolling **7-day window** of job postings for **8 fixed career tracks**, cleans the raw text, extracts skills with a keyword dictionary, and aggregates a skill-frequency count — the input the forecasting model and CV-gap report are built on.

Runs on the Python standard library end to end. A visible browser (Playwright) is only used for the optional Wuzzuf scraping path — everything else (free job APIs, cleaning, skill extraction, quality checks, scheduling) needs nothing beyond stdlib.

---

## Table of contents

1. [What this does, in one paragraph](#what-this-does-in-one-paragraph)
2. [Fixed track list](#fixed-track-list)
3. [Pipeline architecture](#pipeline-architecture)
4. [Repository layout](#repository-layout)
5. [Data schemas](#data-schemas)
6. [The skills dictionary](#the-skills-dictionary)
7. [Data sources: Wuzzuf, free APIs, manual CSV](#data-sources-wuzzuf-free-apis-manual-csv)
8. [The rolling 7-day window, in detail](#the-rolling-7-day-window-in-detail)
9. [Data quality checks](#data-quality-checks)
10. [Setup](#setup)
11. [How to run](#how-to-run)
12. [Testing / fixtures](#testing--fixtures)
13. [Known limitations (read this before trusting the numbers)](#known-limitations-read-this-before-trusting-the-numbers)
14. [Handoff notes for the forecasting model](#handoff-notes-for-the-forecasting-model)
15. [Troubleshooting](#troubleshooting)
16. [Deliverables checklist](#deliverables-checklist)

---

## What this does, in one paragraph

For each of 8 fixed tracks, a scheduler runs `refresh_all_tracks()` every 2 days. Each run fetches only the **newest 2 days** of postings (trying a live Wuzzuf scrape first, falling back automatically to free job-board APIs), merges them into that track's existing 7-day store, drops anything older than 7 days, deduplicates, re-cleans the text, re-extracts skills against a per-track keyword dictionary, and rewrites the skill-frequency count. A client asking for a track's data (`get_track_data()`) only ever reads the latest output files — it never triggers a scrape, so requests are always instant and the scraping load stays fully decoupled from traffic.

## Fixed track list

The pipeline is generic (`track` is a parameter everywhere), but only these 8 are in scope — nothing else is added or removed by any code path:

1. Backend Development
2. Frontend Development
3. Full-Stack Development
4. Mobile Development
5. DevOps & Cloud Engineering
6. Network Administration
7. Network Security
8. Machine Learning / AI

`refresh_pipeline.validate_track()` rejects anything outside this list.

## Pipeline architecture

```
                         every 2 days (scheduler.py)
                                    |
                                    v
                          refresh_all_tracks()
                                    |
                for each of the 8 fixed tracks (refresh_pipeline.py):
                                    |
                    +---------------+----------------+
                    |     fetch_fresh_rows(track)     |
                    |  1. try scrape_wuzzuf()          |
                    |     (real browser, best-effort)  |
                    |  2. on error / 0 rows, fall back  |
                    |     to job_apis.fetch_jobs_for_   |
                    |     track()  (RemoteOK+Arbeitnow) |
                    +---------------+----------------+
                                    |  newest 2 days of raw postings
                                    v
                    load existing raw_jobs_<track>.csv
                    drop rows with date_collected < now-7d
                    append the fresh rows, deduplicate
                    save raw_jobs_<track>.csv, update track_cache.json
                                    |
                                    v
                              clean.py: clean_file()
                    normalize text -> drop empty/duplicate rows
                    -> keyword-match skills_dictionary.json[track]
                                    |
                    +---------------+----------------+
                    |                                |
        clean_jobs_<track>.csv          extracted_skills_<track>.csv
                                                       |
                                                       v
                                     skill_frequency_<track>.csv
                                     (Counter, sorted descending)

        -------------------------------------------------------------
        Any time, independent of the schedule above:
        get_track_data(track) -> reads clean/skills/frequency files.
        No scraping happens here, ever.
```

## Repository layout

Code, config, generated data, and one-off diagnostic scripts each live in their own folder — nothing but `README.md` and `requirements.txt` sits at the top level:

```
DataPipeline/
├── README.md                     <- this file
├── requirements.txt               <- optional extras, only for the Wuzzuf browser path
│
├── src/                           <- all pipeline code
│   ├── refresh_pipeline.py          orchestrator: rolling window, merge/dedupe, cache, CLI
│   ├── job_apis.py                  free job-board API fallback (RemoteOK + Arbeitnow)
│   ├── wuzzuf_scraper.py             Playwright-driven Wuzzuf scraper + manual CSV loader
│   ├── clean.py                     text normalization, skill extraction, output writer
│   ├── quality_check.py              the 3 required data-quality checks
│   └── scheduler.py                  plain interval loop, calls refresh_all_tracks() every 2 days
│
├── config/                        <- the one file you edit by hand, not code
│   └── skills_dictionary.json        per-track keyword lists (24-36 keywords each)
│
├── tools/                         <- standalone diagnostic probes, not part of the pipeline
│   ├── test_cloudscraper.py          does cloudscraper get past Wuzzuf's Cloudflare challenge?
│   │                                  (it doesn't — kept as evidence, see "Data sources" below)
│   └── test_playwright_stealth.py    does playwright-stealth get past it? (also doesn't)
│
└── data/                          <- everything generated or hand-seeded, nothing hand-edited
    ├── track_cache.json              last_scraped_at + file paths, one entry per track
    ├── raw/        raw_jobs_<track>.csv            (one file per track, rolling 7-day store)
    ├── clean/      clean_jobs_<track>.csv           (cleaned + deduplicated + skills column)
    ├── skills/     extracted_skills_<track>.csv      (one row per job x matched skill)
    │               skill_frequency_<track>.csv        (final handoff artifact)
    ├── test/       backend_fixture.csv, devops_fixture.csv  (hand-written fixtures)
    └── browser_profile/   persistent Chromium profile+cookies for the Wuzzuf session
```

`<track>` in filenames is always the lowercase, snake-case slug of the track name, e.g. `Machine Learning / AI` -> `machine_learning_ai`, `DevOps & Cloud Engineering` -> `devops_cloud_engineering` (`refresh_pipeline.slugify()`).

All path constants (`refresh_pipeline.BASE_DIR`, `wuzzuf_scraper.PROFILE_DIR`, `clean.py`'s `--dictionary` default) are computed from each script's own location via `Path(__file__)`, resolving back up to this `DataPipeline/` root — so every command below works the same regardless of whether you run it from `DataPipeline/` or from inside `src/`.

## Data schemas

**`raw_jobs_<track>.csv`** — one row per posting, as collected (before cleaning):

| column | example |
|---|---|
| `job_title` | "Backend Developer" |
| `company` | "Acme" |
| `description_text` | "We are looking for..." (may still contain HTML at this stage) |
| `source` | `"wuzzuf"` / `"remoteok_api"` / `"arbeitnow_api"` / `"manual_upload"` |
| `date_collected` | "2026-09-01" |
| `track` | "Backend Development" |

**`clean_jobs_<track>.csv`** — raw columns plus two more, after `clean.py`:

| column | example |
|---|---|
| `job_id` | "1" (sequence number within this clean run) |
| `job_title` … `track` | normalized (HTML stripped, whitespace collapsed) |
| `skills` | "docker; git; postgresql; python" (semicolon-separated, case-insensitive matches, alphabetical) |

**`extracted_skills_<track>.csv`** — one row per (job, matched skill):

| column | example |
|---|---|
| `job_id` | 1 |
| `skill` | "REST API" |
| `domain` | "Backend Development" |

**`skill_frequency_<track>.csv`** — final handoff artifact, aggregated across every job currently in the track's 7-day window:

| column | example |
|---|---|
| `skill` | "Docker" |
| `count` | 27 |

Sorted by `count` descending, then alphabetically for ties.

**`data/track_cache.json`** — one entry per track, all 8 always present after a refresh:

```json
{
  "Backend Development": {
    "last_scraped_at": "2026-09-02T17:58:16+00:00",
    "raw_file_path": "data/raw/raw_jobs_backend_development.csv",
    "clean_file_path": "data/clean/clean_jobs_backend_development.csv",
    "skills_file_path": "data/skills/extracted_skills_backend_development.csv",
    "frequency_file_path": "data/skills/skill_frequency_backend_development.csv"
  }
}
```

## The skills dictionary

`config/skills_dictionary.json` is a flat JSON object keyed by the 8 track names, each holding a list of lowercase keyword strings — 24 to 36 per track today. It is the single most important artifact in this pipeline: both the clean-time skill extraction and the API-fallback relevance filter (see below) key off it directly, with no code changes needed to add/remove/rename a keyword. It lives in its own `config/` folder specifically to signal "edit me by hand" as distinct from everything in `data/`, which is generated.

Matching (`clean.extract_skills`) is case-insensitive, whole-word/phrase (a `\b`-style boundary, so `"go"` doesn't match inside `"algorithm"`), against `job_title + " " + description_text` combined. Multi-word keywords like `"rest api"` or `"machine learning"` match with flexible internal whitespace.

This list should be reviewed with whoever builds the forecasting model — bad keywords produce bad forecasts downstream. It's plain JSON specifically so it can be edited without touching Python.

## Data sources: Wuzzuf, free APIs, manual CSV

This is the part that changed from the original "just scrape Wuzzuf" plan, and it's worth explaining why.

**The problem:** Wuzzuf (like most job boards) sits behind a Cloudflare-style "verify you are human" challenge. That's legitimate anti-bot protection — this project does not attempt to defeat CAPTCHAs, spoof browser fingerprints at scale, or otherwise route around it. Two standalone probes are kept in `tools/` as evidence of what was tried and rejected:
- `tools/test_cloudscraper.py` — a TLS-fingerprint-spoofing HTTP client. Still gets the challenge page, not real listings.
- `tools/test_playwright_stealth.py` — a real browser with anti-detection patches. Same result.

Practically, this means an unattended script cannot reliably scrape Wuzzuf on its own. `src/wuzzuf_scraper.py` reflects that honestly: it drives a **real, visible** Chromium window via Playwright, with a **persistent session** (`data/browser_profile/`). The first time, a human has to actually clear Wuzzuf's check in that visible window; the session cookie is then saved and reused on later runs for as long as it stays valid. There is no headless/silent mode for this path, by design.

**The fix — automatic fallback, `refresh_pipeline.fetch_fresh_rows()`:**

For every track, every 2-day cycle, in order:

1. **Try `wuzzuf_scraper.scrape_wuzzuf()`.** If the persistent session is already verified, this returns real Wuzzuf postings.
2. **On any exception (Playwright not installed, page failed, still challenged) or a 0-row result, fall back automatically to `job_apis.fetch_jobs_for_track()`.** This hits two public job-board APIs that need no login, no key, and show no verification wall at all:
   - [RemoteOK](https://remoteok.com/api) — broad, global, single unauthenticated GET, no query params.
   - [Arbeitnow](https://www.arbeitnow.com/api/job-board-api) — same idea, EU-leaning.

   Neither API lets you ask for "Network Security jobs" — they return their latest postings across every category, completely unlabelled. So `job_apis.py` reuses `config/skills_dictionary.json` as a classifier: a posting is accepted into a track only if its title + description contain **3 or more distinct keywords** from that track's list. This was tuned empirically against live data — matching on a single keyword produced obvious false positives (e.g. a generic "IT" tag pulling in unrelated postings); requiring 3+ distinct hits gave clean results across all 8 tracks with no ML involved, consistent with the "simple keyword matching" scope for this project. The two APIs are fetched once per `refresh_all_tracks()` cycle and the pool is shared across all 8 tracks (`job_apis.reset_pool_cache()`), not re-fetched per track.

   Other free options were evaluated and rejected: **Remotive**'s public endpoint is still reachable with no key, but its anonymous tier now caps every response at the same 18 postings regardless of `search`/`category` params, so it adds no real coverage. **Adzuna / Reed / Jooble** all work but require registering for an API key, which would add a setup step and a secret to manage for an MVP that's meant to run out of the box — worth revisiting later if broader country/category coverage is needed.

3. **Manual CSV (`--manual-csv`) stays separate and deliberate — never an automatic fallback.** It's the right tool for reproducible test fixtures, or for seeding a track before the scheduler has run, or for a track the two APIs above cover poorly.

To force one source for testing, without touching the browser:

```
python src/refresh_pipeline.py --track "Machine Learning / AI" --source api
python src/refresh_pipeline.py --track "Machine Learning / AI" --source wuzzuf
```

Default (`--source auto`, or omitting the flag entirely) is the fallback chain above.

## The rolling 7-day window, in detail

Each track keeps a 7-day window of postings. Every 2-day cycle:

1. Fetch **only the newest 2 days** (never a full 7-day re-scrape).
2. Load the track's existing `raw_jobs_<track>.csv`.
3. Drop any stored row whose `date_collected` is older than 7 days from now — this removes roughly the oldest 2 days each cycle.
4. Append the freshly fetched rows.
5. Deduplicate the merged set (exact match across all raw columns).
6. Save it back as the track's raw dataset; update `data/track_cache.json` with the new `last_scraped_at`.
7. Re-run clean -> extract skills -> frequency count on the merged raw dataset.

The middle ~5 days are untouched between cycles — only the 2-day edges move. This was verified directly: injecting a synthetic 10-day-old row into a track's raw file and re-running the refresh with zero fresh rows dropped exactly that row (`dropped_old: 1`) and left the real rows untouched. Re-running the same fetch twice in a row does not grow the store — the merge/dedupe step is idempotent.

## Data quality checks

`quality_check.py` implements the three required checks as plain functions (no framework):

- **`check_missing_fields`** — flags any row missing `job_title` or `description_text`.
- **`check_duplicates`** — counts exact-duplicate rows (all columns identical).
- **`check_zero_skill_rows`** — flags any row where the `skills` column ended up empty; this almost always means the keyword dictionary missed something and is worth a manual look.

```
python src/quality_check.py --clean-file data/clean/clean_jobs_backend_development.csv
```

Prints a one-line summary and exits with status `1` if anything failed, `0` if clean — safe to use as a CI/script gate.

## Setup

Core pipeline (scheduler, refresh, cleaning, skill extraction, quality checks, the free-API fallback) needs **only the Python standard library** — no install step required for any of that.

The Wuzzuf browser path is optional and needs extra packages:

```
python -m pip install -r requirements.txt
python -m playwright install chromium
```

`requirements.txt`:
```
playwright>=1.40,<2
cloudscraper>=1.2.71,<2
playwright-stealth>=1.0.6,<2
```
(`cloudscraper` / `playwright-stealth` are only used by the two standalone probe scripts, kept for reference — not by the production scraper.)

## How to run

All commands are run from the `DataPipeline/` root (paths resolve correctly either way, but the examples below assume this).

**Refresh a single track (auto source: Wuzzuf, falls back to APIs):**
```
python src/refresh_pipeline.py --track "Backend Development"
```

**Refresh a single track, forcing one source (useful for testing without a browser):**
```
python src/refresh_pipeline.py --track "Machine Learning / AI" --source api
python src/refresh_pipeline.py --track "Machine Learning / AI" --source wuzzuf --days-back 7
```

**Seed/refresh from a manual CSV (same schema as `raw_jobs_<track>.csv`):**
```
python src/refresh_pipeline.py --track "Backend Development" --manual-csv data/test/backend_fixture.csv
```

**Refresh all 8 tracks once:**
```
python src/refresh_pipeline.py
```

**Run the scheduler (refreshes all 8 tracks immediately, then every 2 days, forever):**
```
python src/scheduler.py
# or a custom interval:
python src/scheduler.py --interval-days 2
```
Stop with `Ctrl+C`. This is the "no manual trigger needed for normal operation" path from the spec — a plain interval loop, no Celery/Airflow.

**Run cleaning standalone against an arbitrary raw CSV:**
```
python src/clean.py --track "Backend Development" --input data/raw/raw_jobs_backend_development.csv \
  --dictionary config/skills_dictionary.json \
  --clean-output data/clean/clean_jobs_backend_development.csv \
  --skills-output data/skills/extracted_skills_backend_development.csv \
  --frequency-output data/skills/skill_frequency_backend_development.csv
```
(`--dictionary` defaults to `config/skills_dictionary.json` automatically — only pass it to point at a different file.)

**Run quality checks:**
```
python src/quality_check.py --clean-file data/clean/clean_jobs_backend_development.csv
```

**Read what a client would get (no scraping triggered):**
```python
import sys; sys.path.insert(0, "src")
from refresh_pipeline import get_track_data
data = get_track_data("Network Security")   # {"clean": [...], "skills": [...], "frequency": [...]}
```

## Testing / fixtures

`data/test/backend_fixture.csv` and `data/test/devops_fixture.csv` are hand-written, 4-row postings each with one intentional exact duplicate. They exist so the cleaning/extraction/quality-check code can be validated without depending on the scraper or network access at all.

Run in isolation (bypassing the rolling-window merge, to test `clean.py` on its own):
```
python src/clean.py --track "Backend Development" --input data/test/backend_fixture.csv \
  --clean-output /tmp/clean.csv --skills-output /tmp/skills.csv --frequency-output /tmp/freq.csv
```
Expected, and verified: **3 cleaned rows** (1 dropped as an exact duplicate), **0 zero-skill rows**, 16 total skill matches for the backend fixture and 21 for the DevOps fixture.

Run through the full rolling-refresh path instead (merges with whatever is already in that track's raw store — not idempotent against prior runs the same way, by design, since the real pipeline is meant to accumulate):
```
python src/refresh_pipeline.py --track "Backend Development" --manual-csv data/test/backend_fixture.csv
python src/quality_check.py --clean-file data/clean/clean_jobs_backend_development.csv
```

## Known limitations (read this before trusting the numbers)

Being upfront about coverage, rather than overselling it:

- **Wuzzuf scraping is manual-assist, not fully unattended.** It works after a human clears the verification challenge once per browser profile; it cannot be guaranteed to run silently on a schedule with nobody watching. Treat it as a bonus source, not the primary one, until/unless that changes.
- **The free-API fallback has uneven coverage across tracks.** Backend, Frontend, Full-Stack, DevOps, Mobile, and ML/AI reliably surface multiple real, correctly-classified postings per cycle. Network Administration and Network Security postings are rarer on these boards (they're general/remote-tech boards, not networking-specific boards) — expect single-digit counts per cycle for those two, sometimes zero on a quiet day. That's a real signal, not a bug: seed those two tracks with manual CSVs if the forecasting model needs denser data than the APIs currently provide.
- **The 3-distinct-keyword classification threshold is a precision/recall tradeoff, not a guarantee.** It was tuned against one live snapshot of both APIs and eliminated the false positives that showed up at a threshold of 1. It's still keyword matching, not semantic understanding — a posting that's genuinely relevant but sparsely worded can still be missed.
- **API postings are largely EU/remote-tech-skewed** (RemoteOK and Arbeitnow's own audiences), which will bias the skill-frequency counts toward that market's tech stack rather than, say, the Egyptian job market Wuzzuf would reflect. Worth flagging to the forecasting model owner if the target audience is more local than global.

## Handoff notes for the forecasting model

- Per-job skills are available two ways: as a semicolon-separated string in `clean_jobs_<track>.csv["skills"]`, or exploded one-row-per-skill in `extracted_skills_<track>.csv`. Pick whichever shape is easier to ingest — both are generated from the same data every refresh.
- `skill_frequency_<track>.csv` is the raw count, not normalized/percentage — normalize on your side if the model needs a rate rather than a count, since the total number of postings per track varies.
- `job_id` is only unique **within one track's current clean file**, not globally — don't join across tracks on it without namespacing by track first.
- Confirm early whether the model wants raw counts, normalized frequencies, or one-hot columns per skill — reshaping this later under time pressure is exactly what this note is here to avoid.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `RuntimeError: Playwright is required` | Wuzzuf path only — run `pip install -r requirements.txt && python -m playwright install chromium`, or just use `--source api`. |
| Wuzzuf scraper opens a browser and seems stuck | It's waiting for a human to clear the Cloudflare/"Just a moment" challenge in that visible window. Solve it once; the session persists in `data/browser_profile/` afterward. |
| `fetch=0` / very few rows from `--source api` | Normal for Network Administration / Network Security on a quiet day — see [Known limitations](#known-limitations-read-this-before-trusting-the-numbers). Also check your network can reach `remoteok.com` and `arbeitnow.com`. |
| `ValueError: Unsupported track` | The track name must match the fixed list exactly, including punctuation (`"DevOps & Cloud Engineering"`, `"Machine Learning / AI"`). |
| Re-running a fixture doesn't reproduce "3 clean rows" | If that track's raw store already has other data (from a previous scrape/API pull), the fixture rows merge into it instead of replacing it — that's the rolling-window design working as intended. Use the isolated `clean_file()` call from [Testing](#testing--fixtures) for a clean-room check instead. |

## Deliverables checklist

- [x] `src/wuzzuf_scraper.py` — track-based scraper (last 2 days per cycle), manual CSV loader
- [x] `src/job_apis.py` — free job-board API fallback (RemoteOK + Arbeitnow), classified via `config/skills_dictionary.json`
- [x] `src/refresh_pipeline.py` — rolling-window merge logic + Wuzzuf/API fallback + clean/extract/frequency orchestration
- [x] `src/scheduler.py` — calls `refresh_all_tracks()` every 2 days automatically
- [x] `data/track_cache.json` — `last_scraped_at` + file paths per track, all 8 tracks
- [x] `data/raw/raw_jobs_<track>.csv` — present for all 8 tracks (manual-upload template doubles as fallback/seed)
- [x] `src/clean.py` — cleaning + skill extraction
- [x] `src/quality_check.py` — the 3 required checks
- [x] `data/clean/clean_jobs_<track>.csv` + `data/skills/extracted_skills_<track>.csv` — present for all 8 tracks
- [x] `data/skills/skill_frequency_<track>.csv` — present for all 8 tracks, sorted descending
- [x] `config/skills_dictionary.json` — 24-36 keywords per track, editable independent of code
- [x] `README.md` — this file
