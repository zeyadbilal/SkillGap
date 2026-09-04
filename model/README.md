## Model Workspace

This folder is dedicated to CV/NLP model work and is intentionally separate from `backend/`.

### Current components

- `nlp/spacy_extractor.py`: spaCy-powered extractor (with regex fallback) that reads CV text from stdin and outputs JSON.

### Backend integration

Backend calls this script through `backend/src/services/pyNlpService.js`.

Optional env vars:

- `CV_NLP_CONDA_ENV` (default: `myproject`)
- `CV_NLP_SCRIPT_PATH` (override script path when needed)
