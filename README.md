---
title: Sentiment Observatory API
emoji: 🎬
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Sentiment Observatory

Explore how audiences really feel about movies. Search any film, fetch real TMDB reviews, and visualise sentiment through interactive charts.

## Overview

| | |
|---|---|
| **Model** | `distilbert-base-uncased` fine-tuned on SST-2 |
| **Task** | Binary sentiment classification (POSITIVE / NEGATIVE) |
| **Backend** | FastAPI + Uvicorn, managed with [uv](https://github.com/astral-sh/uv) |
| **Frontend** | React + Vite + Tailwind CSS + Recharts |
| **Movie data** | TMDB API |

## Project structure

```
.
├── main.py              # FastAPI server — /predict, /movies/search, /movies/{id}/reviews
├── tmdb.py              # Async TMDB client
├── train.py             # Fine-tuning script — saves checkpoint to results/best_model/
├── Dockerfile           # Backend container
├── docker-compose.yml   # Runs backend + frontend together
├── pyproject.toml       # uv-managed deps
├── requirements.txt     # Pinned deps for Docker
├── .env                 # TMDB_API_KEY
├── results/             # Training output (gitignored)
│   └── best_model/      # Saved model loaded at startup
└── frontend/
    ├── Dockerfile        # Frontend container (multi-stage: Node build → nginx)
    ├── nginx.conf        # Serves static files, proxies /api → backend
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   ├── components/   # MovieHeader, SentimentArc, ScoreScatter, …
    │   ├── hooks/        # useMovieReviews, useSearchMovies
    │   └── utils/        # sentiment, stats, chartExport
    └── package.json
```

---

## Running with Docker

The easiest way to run the full stack.

### Prerequisites

- Docker and Docker Compose installed
- A trained model checkpoint in `results/best_model/` (see [Train the model](#train-the-model) below)
- A `.env` file with your TMDB token:
  ```
  TMDB_API_KEY=eyJ...
  ```

### Start

```bash
docker compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`

### Stop

```bash
docker compose down
```

---

## Running locally (development)

### Prerequisites

- [uv](https://github.com/astral-sh/uv) installed
- Node.js 20+
- A `.env` file with your TMDB token

### 1. Backend

```bash
# Install Python deps
uv sync

# (First run only) Train the model — saves to results/best_model/
uv run python train.py

# Start the API
uv run python -m uvicorn main:app --reload
```

API available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

> **Note (Windows):** Use `python -m uvicorn` instead of `fastapi dev` — the uvicorn trampoline is broken in some uv versions on Windows.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`. Vite proxies `/api/*` to the backend automatically.

---

## Train the model

Required before running the app for the first time. Downloads `distilbert-base-uncased` and the GLUE SST-2 dataset from HuggingFace, fine-tunes the model, and saves the best checkpoint to `results/best_model/`.

```bash
uv run python train.py
```

---

## API endpoints

### `GET /`
Health check.

### `POST /predict`
Single text → `{ label, score, latency_ms }`.

### `POST /predict/batch`
Up to 32 texts → `{ results[], total_latency_ms }`.

### `GET /movies/search?q=<title>`
Search TMDB → `{ results: [{ id, title, release_date, overview, poster_path }] }`.

### `GET /movies/{id}/reviews`
Fetch up to 100 TMDB reviews, run sentiment inference, return enriched review objects with `sentiment_label`, `sentiment_score`, `author`, `author_rating`, `created_at`, `content`.

---

## Frontend charts

- **Sentiment Arc** — sentiment score over time (scatter + 7-review rolling average). Hover dots for author/date/snippet tooltip.
- **Score Scatter** — star rating vs. sentiment score with Pearson r correlation and regression line. Disagree points (stars ≠ sentiment) highlighted.

Both charts support toggling points/trend, PNG export, and keyboard-accessible annotations.
