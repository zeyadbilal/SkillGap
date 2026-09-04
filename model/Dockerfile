FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_PORT=5001

WORKDIR /app

COPY model/requirements.txt ./model/requirements.txt
RUN pip install --no-cache-dir -r model/requirements.txt \
    && python -m spacy download en_core_web_sm

COPY model ./model
COPY DataPipeline/config ./DataPipeline/config
COPY DataPipeline/data/skills ./DataPipeline/data/skills

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "model.service.app:app"]
