# Model service

The CV analysis engine runs as a Flask service, separately from the Express API. Phase 1 is a strict port of the previous JavaScript/Python pipeline: response fields, scoring, ordering, confidence values, proficiency defaults, and track fallback behavior are intentionally unchanged.

## Setup

From the repository root:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r model/service/requirements.txt
python -m spacy download en_core_web_sm
python -m model.service.app
```

The development service listens on `http://127.0.0.1:5001` by default. Override its port with `MODEL_PORT`.

Start the backend separately:

```bash
cd backend
MODEL_SERVICE_URL=http://127.0.0.1:5001 npm start
```

`MODEL_SERVICE_TIMEOUT_MS` controls the backend HTTP timeout and defaults to 30 seconds.

## API

`POST /analyze` accepts the same analysis body already validated by Express:

```json
{
  "cvText": "Backend engineer with experience building Node.js APIs...",
  "track": "Backend Development"
}
```

Only `cvText` and the optional `track` are accepted. The engine internally reviews 12 market skills and builds a three-month roadmap with up to three skills per month.

The Flask response is the raw analysis result. Express preserves the public wrapper:

```json
{
  "success": true,
  "data": {
    "profileSummary": {},
    "currentSkills": [],
    "skillGaps": [],
    "learningRoadmap": [],
    "usefulStuff": {},
    "generatedAt": "...",
    "pipeline": { "extractor": "python-spacy" }
  }
}
```

There is no JavaScript analysis fallback. If Flask cannot be reached before the configured timeout, Express returns `503` with `errorCode: "MODEL_UNAVAILABLE"`.

## Tests

The deterministic engine tests do not require Flask or spaCy:

```bash
python3 -m unittest model.service.tests.test_engine
```

The frozen parity fixture was captured from the legacy engine before the service boundary changed. Tests compare the complete result after removing only `generatedAt`.
