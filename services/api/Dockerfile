FROM python:3.12-slim

WORKDIR /workspace

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/workspace

RUN pip install --no-cache-dir uv

COPY services/api/requirements.txt ./services/api/requirements.txt

RUN uv pip install --system -r services/api/requirements.txt

COPY services ./services
COPY packages ./packages

EXPOSE 8000

CMD ["uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]