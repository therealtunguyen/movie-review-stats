import time
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import pipeline

from tmdb import fetch_reviews, search_movies

load_dotenv()

MODEL_PATH = "./results/best_model"

ml: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Loading model from {MODEL_PATH} ...")
    ml["pipe"] = pipeline(
        "text-classification",
        model=MODEL_PATH,
        tokenizer=MODEL_PATH,
        truncation=True,
        max_length=128,
    )
    print("Model is ready")
    yield
    ml.clear()


app = FastAPI(
    title="Sentiment API",
    description="DistilBERT fine-tuned on SST-2 — binary sentiment classification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=512,
        example="This movie was absolutely fantastic!",
    )


class PredictResponse(BaseModel):
    text: str
    label: str  # "POSITIVE" | "NEGATIVE"
    score: float  # confidence 0–1
    latency_ms: float


class BatchRequest(BaseModel):
    texts: list[str] = Field(
        ...,
        min_length=1,
        max_length=32,
        example=["Great film!", "Terrible waste of time."],
    )


class BatchResponse(BaseModel):
    results: list[PredictResponse]
    total_latency_ms: float


class MovieResult(BaseModel):
    id: int
    title: str
    release_year: int | None
    poster_url: str | None
    tmdb_rating: float | None


class MovieSearchResponse(BaseModel):
    results: list[MovieResult]


class ReviewResult(BaseModel):
    id: str
    author: str
    content: str
    author_rating: float | None
    created_at: str
    sentiment_label: str
    sentiment_score: float


class MovieReviewsResponse(BaseModel):
    movie_id: int
    title: str
    review_count: int
    reviews: list[ReviewResult]


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "model": MODEL_PATH}


@app.post("/predict", response_model=PredictResponse, tags=["inference"])
def predict(req: PredictRequest):
    if "pipe" not in ml:
        raise HTTPException(status_code=503, detail="Model not loaded")

    t0 = time.perf_counter()
    result = ml["pipe"](req.text)[0]
    latency = (time.perf_counter() - t0) * 1000

    return PredictResponse(
        text=req.text,
        label=result["label"],
        score=round(result["score"], 4),
        latency_ms=round(latency, 2),
    )


@app.post("/predict/batch", response_model=BatchResponse, tags=["inference"])
def predict_batch(req: BatchRequest):
    if "pipe" not in ml:
        raise HTTPException(status_code=503, detail="Model not loaded")

    t0 = time.perf_counter()
    raw = ml["pipe"](req.texts)
    total_latency = (time.perf_counter() - t0) * 1000

    results = [
        PredictResponse(
            text=text,
            label=r["label"],
            score=round(r["score"], 4),
            latency_ms=round(total_latency / len(req.texts), 2),
        )
        for text, r in zip(req.texts, raw)
    ]

    return BatchResponse(results=results, total_latency_ms=round(total_latency, 2))


@app.get("/movies/search", response_model=MovieSearchResponse, tags=["movies"])
async def movies_search(q: str = Query(..., min_length=1)):
    try:
        movies = await search_movies(q)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="TMDB request timed out") from exc
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return MovieSearchResponse(results=[MovieResult(**m) for m in movies])


@app.get(
    "/movies/{movie_id}/reviews", response_model=MovieReviewsResponse, tags=["movies"]
)
async def movies_reviews(movie_id: int):
    if "pipe" not in ml:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        title, reviews = await fetch_reviews(movie_id)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="TMDB request timed out") from exc
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not reviews:
        return MovieReviewsResponse(
            movie_id=movie_id, title=title, review_count=0, reviews=[]
        )

    # Truncate to 512 chars for inference, keep full content for response
    truncated = [r["content"][:512] for r in reviews]

    # Run inference in chunks of 32
    chunk_size = 32
    predictions: list[dict] = []
    for i in range(0, len(truncated), chunk_size):
        chunk = truncated[i : i + chunk_size]
        predictions.extend(ml["pipe"](chunk))

    review_results = [
        ReviewResult(
            id=review["id"],
            author=review["author"],
            content=review["content"],
            author_rating=review["author_rating"],
            created_at=review["created_at"],
            sentiment_label=pred["label"],
            sentiment_score=round(pred["score"], 4),
        )
        for review, pred in zip(reviews, predictions)
    ]

    return MovieReviewsResponse(
        movie_id=movie_id,
        title=title,
        review_count=len(review_results),
        reviews=review_results,
    )
