## Model Workspace

This folder is dedicated to CV/NLP model work and is intentionally separate from `backend/`.

### Current components

- `nlp/spacy_extractor.py`: spaCy-based CV skill extractor with regex fallback.

### Backend integration

`backend/src/services/pyNlpService.js` calls this script with:

`conda run -n <env> python model/nlp/spacy_extractor.py`

Optional environment variables:

- `CV_NLP_CONDA_ENV` (default: `myproject`)
- `CV_NLP_SCRIPT_PATH` (override script path)
