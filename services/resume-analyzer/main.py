"""FastAPI microservice: heuristic resume scoring (extend with ML/NLP later)."""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Resume Analyzer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeBody(BaseModel):
    text: str = Field(..., min_length=10, max_length=50_000)
    job_description: str | None = Field(default=None, max_length=20_000)


def analyze_resume(text: str, job_description: str | None) -> dict[str, Any]:
    t = text.strip()
    words = t.split()
    word_count = len(words)
    issues: list[str] = []
    tips: list[str] = []

    if len(t) < 200:
        issues.append("Overall length is short — add impact bullets with metrics.")
    if word_count < 50:
        issues.append("Very few words — recruiters expect concrete outcomes per role.")

    strong = ("%", "increased", "reduced", "led", "built", "shipped", "million", "users", "latency", "revenue")
    hits = sum(1 for s in strong if s.lower() in t.lower())
    if hits < 2:
        tips.append("Add quantified outcomes (%, $, time saved, users, scale).")

    score = 42 + min(28, word_count // 4) + min(24, hits * 5)
    score = max(0, min(100, score))

    if job_description and len(job_description.strip()) > 20:
        jd_words = {w.lower() for w in job_description.split() if len(w) > 4}
        overlap = sum(1 for w in jd_words if w in t.lower())
        score = min(100, score + min(12, overlap))
        if overlap < 4:
            tips.append("Mirror key skills and tools from the job description where honest.")

    return {
        "score": score,
        "wordCount": word_count,
        "issues": issues,
        "tips": tips,
        "disclaimer": "Heuristic preview only — not hiring or legal advice. Upgrade with ATS APIs or ML later.",
    }


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/analyze")
def analyze(body: AnalyzeBody) -> dict[str, Any]:
    return analyze_resume(body.text, body.job_description)
