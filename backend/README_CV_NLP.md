CV NLP integration

This branch adds an optional Python spaCy-based CV extractor and integrates it into the Node recommendation pipeline.

How it works
- backend/scripts/spacy_extractor.py: Python script that reads CV text from stdin and returns JSON with detectedSkills and inferredTrack.
- backend/src/services/pyNlpService.js: Node bridge that calls `conda run -n <env> python backend/scripts/spacy_extractor.py` and returns parsed JSON.
- recommendationService prefers the Python extractor when available and falls back to the existing JS extractor (marketData.extractSkillsFromText).

Running locally
1. Activate the conda environment (default: myproject) or set CV_NLP_CONDA_ENV in env:
   conda activate myproject
   export CV_NLP_CONDA_ENV=myproject
2. Ensure required Python packages are installed in the conda env (spaCy, scikit-learn). From host shell:
   conda install -n myproject -c conda-forge spacy scikit-learn click -y
   conda run -n myproject python -m spacy download en_core_web_sm
3. Test the Python extractor:
   cat my_cv.txt | conda run -n myproject python backend/scripts/spacy_extractor.py

Running Node tests
- From backend/ run:
  npm ci
  npm test

Notes
- The Python extractor is optional; CI and reviewers can keep the conda step out of automated pipelines if desired.
- Before pushing, run the tests and verify performance when large CV batches are used.
