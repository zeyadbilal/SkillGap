FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN useradd --create-home --system nlpuser

COPY model/requirements.txt /app/model/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r /app/model/requirements.txt && \
    python -m spacy download en_core_web_sm

COPY DataPipeline/config/skills_dictionary.json /app/DataPipeline/config/skills_dictionary.json
COPY model /app/model

RUN chown -R nlpuser:nlpuser /app
USER nlpuser

ENTRYPOINT ["python", "model/nlp/spacy_extractor.py"]