import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import pipeline

# ── Config ────────────────────────────────────────────────────────────────────

MODEL_PATH = "./results/best_model"  # produced by train.py


# ── Lifespan (load model once on startup) ─────────────────────────────────────

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
    print("Model ready ✅")
    yield
    ml.clear()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Sentiment API",
    description="DistilBERT fine-tuned on SST-2 — binary sentiment classification",
    version="1.0.0",
    lifespan=lifespan,
)


# ── Schemas ───────────────────────────────────────────────────────────────────


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


# ── Routes ────────────────────────────────────────────────────────────────────


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
