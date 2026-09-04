# Backend–model integration

CV analysis is split across two processes:

- Express owns HTTP request validation and the public `{ success, data }` response envelope.
- Flask owns skill extraction, track inference, market comparison, gap ranking, and roadmap generation.
- `backend/src/services/model/modelClient.js` is the only bridge between them.

The previous per-request Python child process and JavaScript fallback have been removed from the production analysis path.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `MODEL_SERVICE_URL` | `http://localhost:5001` | Flask model-service base URL |
| `MODEL_SERVICE_TIMEOUT_MS` | `30000` | HTTP timeout in milliseconds |

## Run locally

Start the model service from the repository root:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r model/service/requirements.txt
python -m spacy download en_core_web_sm
python -m model.service.app
```

Then start Express:

```bash
cd backend
npm install
npm run dev
```

## Public endpoint

`POST /recommendations/analyze`

```json
{
  "cvText": "Machine learning engineer with Python and PyTorch experience..."
}
```

The endpoint requires a bearer access token. The backend derives the analysis track from the authenticated user's `fieldOfStudy`; clients cannot submit or override `track`.

The endpoint accepts either the JSON body above or a multipart form containing:

- `file`: one PDF, DOCX, or TXT file, up to 10 MB.

Uploaded files are stored under the operating system's temporary directory, checked by extension and content signature, converted to text, and deleted when the response finishes or the connection closes. The frontend is not wired to this endpoint yet.

The CV text and derived track are forwarded to Flask. Study fields that have no corresponding model track use the model's existing CV-based track inference. Analysis uses fixed internal limits of 12 market skills and a three-month roadmap with up to three skills per month. The success response remains:

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

If the model service is unavailable or exceeds the timeout, the endpoint returns:

```json
{
  "success": false,
  "error": "Model service is unavailable",
  "errorCode": "MODEL_UNAVAILABLE"
}
```

There is deliberately no backend analysis fallback.

## Verification

```bash
python3 -m unittest model.service.tests.test_engine
cd backend
npm test -- --runInBand test/modelClient.test.js test/recommendations.test.js
```

Parity means structural and semantic equality with the legacy result. Tests ignore `generatedAt`, which is produced at request time.
