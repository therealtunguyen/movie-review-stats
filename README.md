# Sentiment API

Fine-tune **DistilBERT** on the SST-2 dataset and serve it as a REST API with FastAPI.

## Overview

| | |
|---|---|
| **Model** | `distilbert-base-uncased` fine-tuned on SST-2 |
| **Task** | Binary sentiment classification (POSITIVE / NEGATIVE) |
| **Dataset** | [GLUE SST-2](https://huggingface.co/datasets/glue) — Stanford Movie Reviews |
| **Serving** | FastAPI + Uvicorn |
| **Packaging** | Docker |
| **Deps** | [uv](https://github.com/astral-sh/uv) |

## Project structure

```
.
├── main.py          # FastAPI inference server
├── train.py         # Training script (fine-tunes DistilBERT, saves to results/)
├── Dockerfile       # Production container
├── pyproject.toml   # Project metadata and dependencies
├── requirements.txt # Pinned requirements for Docker
└── results/         # Training output — gitignored
    └── best_model/  # Saved model loaded by the API
```

## Quickstart

### 1. Install dependencies

```bash
uv sync
```

### 2. Train the model

```bash
uv run python train.py
```

This downloads `distilbert-base-uncased` and the SST-2 dataset from HuggingFace, fine-tunes the model, and saves the best checkpoint to `results/best_model/`.

### 3. Run the API

```bash
uv run python -m uvicorn main:app --reload
```

> **Note (Windows):** `fastapi dev` / `uvicorn` trampolines are broken in some uv versions on Windows. Use `python -m uvicorn` instead.

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## API endpoints

### `GET /`
Health check.
```json
{"status": "ok", "model": "./results/best_model"}
```

### `POST /predict`
Single text prediction.

**Request:**
```json
{"text": "This movie was absolutely fantastic!"}
```

**Response:**
```json
{
  "text": "This movie was absolutely fantastic!",
  "label": "POSITIVE",
  "score": 0.9987,
  "latency_ms": 12.4
}
```

### `POST /predict/batch`
Batch prediction (up to 32 texts).

**Request:**
```json
{"texts": ["Great film!", "Terrible waste of time."]}
```

**Response:**
```json
{
  "results": [
    {"text": "Great film!", "label": "POSITIVE", "score": 0.9981, "latency_ms": 6.1},
    {"text": "Terrible waste of time.", "label": "NEGATIVE", "score": 0.9973, "latency_ms": 6.1}
  ],
  "total_latency_ms": 12.3
}
```

## Docker

```bash
# Build
docker build -t ml-api .

# Run
docker run -p 8000:8000 ml-api
```

The Dockerfile installs dependencies via uv and serves the API on port 8000.
