FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_PORT=5001

WORKDIR /app

RUN addgroup --system app \
    && adduser --system --ingroup app app

COPY model/requirements.txt ./model/requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r model/requirements.txt \
    && python -m spacy download en_core_web_sm

COPY --chown=app:app model ./model
COPY --chown=app:app DataPipeline/config ./DataPipeline/config
COPY --chown=app:app DataPipeline/data/skills ./DataPipeline/data/skills

USER app

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--access-logfile", "-", "model.service.app:app"]