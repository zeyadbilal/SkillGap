Backend — CV NLP Integration
=============================

This document describes the backend integration for the CV → skill-gap recommendation pipeline. It explains architecture, installation, configuration, API usage, testing, CI recommendations, troubleshooting, and extension points.

Overview
--------
- Purpose: analyze free-form CV text and return a ranked list of detected skills, inferred career track, market-match scoring and a short learning roadmap (skill gaps).
- Design: a Python spaCy extractor (model/nlp/spacy_extractor.py) performs the heavy NLP. A Node bridge (backend/src/services/pyNlpService.js) runs the extractor and parses JSON. The cvRecommendationService coordinates Python extraction (preferred) and a JS fallback (marketData.extractSkillsFromText) when Python is unavailable.

Key components
--------------
- model/nlp/spacy_extractor.py  — spaCy-based extractor with regex fallback; reads CV text from stdin and writes JSON to stdout.
- backend/src/services/pyNlpService.js — runs the Python script using a configured Python executable or an optional conda environment, provides timeouts, and returns parsed extractor output or an error code.
- backend/src/services/cvRecommendationService.js — orchestrates extraction, infers track, computes match scores against DataPipeline/config/skills_dictionary.json and produces the final recommendation object.
- backend/src/services/marketData.js — skill dictionary utilities and the JS fallback extractor.
- backend/src/controllers/recommendationController.js and backend/src/routes/recommendations.js — HTTP controller and route for the analysis endpoint.
- backend/src/middleware/validation/recommendationSchemas.js — Joi validation for request payloads.

Environment & prerequisites
---------------------------
- Node >= 14 (use nvm), npm or yarn for installing backend dependencies.
- Python with the extractor dependencies installed. This can be system Python, venv, pyenv, uv, poetry, conda, or a Docker/container runtime.
- Conda (Miniconda/Anaconda) is optional. Set CV_NLP_CONDA_ENV only when you want the backend to run the extractor through conda.

Recommended env variables
-------------------------
- CV_NLP_PYTHON_BIN — optional Python executable used to run the extractor when CV_NLP_CONDA_ENV is not set. If omitted, the backend tries `python3`, then `python`.
- CV_NLP_CONDA_ENV — optional conda environment name. When set, the backend runs `conda run -n "$CV_NLP_CONDA_ENV" python "$CV_NLP_SCRIPT_PATH"` instead of CV_NLP_PYTHON_BIN.
- CV_NLP_SCRIPT_PATH (default: model/nlp/spacy_extractor.py) — path to the extractor script.
- CV_NLP_TIMEOUT_MS (default: 10000) — extractor timeout in milliseconds.
- USE_PYTHON_NLP (true/false) — prefer Python extractor when true, else force JS fallback.

Local installation (quick)
--------------------------
1. Install Node deps:
   cd backend
   npm ci

2. Create a Python environment and install Python deps (venv example):
   python3 -m venv .venv
   . .venv/bin/activate
   pip install spacy scikit-learn click
   python -m spacy download en_core_web_sm

3. Or create a conda env and install Python deps:
   conda create -n myproject python=3.10 -y
   conda activate myproject
   conda install -n myproject -c conda-forge spacy scikit-learn click -y
   conda run -n myproject python -m spacy download en_core_web_sm

4. Run backend (development) with venv/system Python:
   export CV_NLP_PYTHON_BIN=.venv/bin/python
   export CV_NLP_SCRIPT_PATH=model/nlp/spacy_extractor.py
   npm run dev   # or npm start depending on project scripts

   Or, with conda:
   export CV_NLP_CONDA_ENV=myproject
   export CV_NLP_SCRIPT_PATH=model/nlp/spacy_extractor.py
   npm run dev

Running the extractor directly
-----------------------------
- Example using venv/system Python:
  cat my_cv.txt | "$CV_NLP_PYTHON_BIN" "$CV_NLP_SCRIPT_PATH"

- Example using conda run:
  cat my_cv.txt | conda run -n "$CV_NLP_CONDA_ENV" python "$CV_NLP_SCRIPT_PATH"

- Example output (excerpt):
  {
    "detectedSkills": [{"skill":"node.js","tracks":["Backend Development"],"mentions":3,"confidence":0.9,"proficiencyLevel":"Intermediate"}, ...],
    "inferredTrack":"Backend Development",
    "textLength":1200
  }

API: POST /api/v1/recommendations/analyze
----------------------------------------
Request JSON body (fields):
- cvText (string, required, min 20 chars) — raw CV text
- track (optional string) — suggested track to bias recommendations
- topSkillsLimit (integer, optional, default 12) — number of top market skills to compare against when computing gaps/match score
- roadmapMonths (integer, optional, default 3) — months to build roadmap for
- skillsPerMonth (integer, optional, default 3)

Example request:
{
  "cvText": "Senior backend engineer with 5 years experience in Node.js, Express, MongoDB...",
  "topSkillsLimit": 10,
  "roadmapMonths": 6,
  "skillsPerMonth": 4
}

Example response (simplified):
{
  "success": true,
  "data": { "profileSummary": { "track": "Backend Development", "matchScore": 42, ... }, "currentSkills": [ ... ], "skillGaps": [ ... ], "learningRoadmap": [ ... ], "pipeline": { "extractor": "python-spacy" } }
}

Behavior notes
--------------
- The service prefers the Python extractor when the script exists and either CV_NLP_PYTHON_BIN, python3/python, or CV_NLP_CONDA_ENV can run it. If Python is unavailable, recommendation analysis falls back to the JS extractor.
- Detected skill strings are normalized (lowercased, punctuation trimmed) and aggregated by count.
- Proficiency inference uses heuristics ("X years", contextual phrases). Consider replacing with NER/proficiency models for higher fidelity.

Testing
-------
- Unit & integration tests live under backend/test. Run:
  cd backend && npm ci && npm test

- To test the Python extractor in isolation, run:
  echo "<sample CV text>" | python3 model/nlp/spacy_extractor.py

CI recommendations
------------------
Options depending on tradeoffs:
1. Keep Python extractor optional in CI (recommended): CI runs the JS fallback. This avoids installing conda in CI and keeps runs fast.
2. Install Python dependencies in CI with venv or your Python package manager. Example snippet:

```yaml
- name: Setup Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.10'
- name: Install Python NLP deps
  run: |
    python -m venv .venv
    . .venv/bin/activate
    pip install spacy scikit-learn click
    python -m spacy download en_core_web_sm
- name: Run backend tests
  run: |
    cd backend
    npm ci
    npm test
  env:
    CV_NLP_PYTHON_BIN: ../.venv/bin/python
    CV_NLP_SCRIPT_PATH: model/nlp/spacy_extractor.py
```

3. Install conda in CI: use a GitHub Actions step that installs Miniconda, creates the env, installs packages, and downloads models. Example snippet:

```yaml
- name: Setup Miniconda
  uses: goanpeca/setup-miniconda@v2
  with:
    python-version: 3.10
- name: Create env & install deps
  run: |
    conda create -n myproject -y python=3.10
    conda activate myproject
    conda install -n myproject -c conda-forge spacy scikit-learn click -y
    conda run -n myproject python -m spacy download en_core_web_sm
- name: Run backend tests
  run: |
    cd backend
    npm ci
    npm test
  env:
    CV_NLP_CONDA_ENV: myproject
    CV_NLP_SCRIPT_PATH: model/nlp/spacy_extractor.py
```

4. Containerize the extractor into a small Docker image (recommended for reproducibility): build an image with Python and spaCy preinstalled and invoke it from Node.

Troubleshooting & common issues
-------------------------------
- "python3 is not available" or "PYTHON_NOT_FOUND": set CV_NLP_PYTHON_BIN to your Python executable, for example `.venv/bin/python`.
- "conda is not available" or "CONDA_NOT_FOUND": unset CV_NLP_CONDA_ENV or install Miniconda/Anaconda.
- JSON parse errors from extractor: run the extractor manually on the same CV text to surface Python exceptions.
- Timeouts: increase CV_NLP_TIMEOUT_MS if large CVs or slow models are expected.
- Merge conflicts & author metadata: when rewriting commit authors, ensure the repository history is consistent and prefer creating a PR rather than force-pushing main.
- Push rejected due to private email: configure git user.email to a public noreply or make your email public on GitHub.

Security & performance notes
----------------------------
- Validate input length and sanitize fields to avoid runaway memory usage.
- Limit cvText size (e.g., 200k chars) or stream processing for very large inputs.
- Run extractor as a short-lived process with strict timeouts to avoid resource exhaustion. Consider an async queue (RabbitMQ/Redis) for high volume.

Extending & next steps
----------------------
- Replace small spaCy model with transformer-based NER or sentence-transformer embeddings for more accurate extraction and semantic matching.
- Package the extractor into a standalone microservice (HTTP or gRPC) for better scaling and language isolation.
- Improve proficiency inference using a trained classifier over annotated CVs.
- Expand the market skills dataset and add probabilistic matching (fuzzy matching, embeddings) to reduce false negatives.

Contact / Credits
-----------------
- Maintainers: project contributors and the CV-NLP feature authors.
- The Python extractor is implemented with spaCy; see model/README.md for model-level notes and reproduction steps.

Appendix: environment var defaults
----------------------------------
- CV_NLP_PYTHON_BIN unset
- CV_NLP_CONDA_ENV unset
- CV_NLP_SCRIPT_PATH=model/nlp/spacy_extractor.py
- CV_NLP_TIMEOUT_MS=10000
- USE_PYTHON_NLP=true


Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
