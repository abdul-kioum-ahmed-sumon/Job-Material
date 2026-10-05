# Multi-stage Docker build for Post2PDF (Unified Single Container)
# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY post2pdf/frontend/package*.json ./
RUN npm install
COPY post2pdf/frontend/ ./
RUN npm run build

# Stage 2: Python backend with compiled static assets
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

COPY post2pdf/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY post2pdf/backend/ .
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
