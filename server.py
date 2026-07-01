"""FastAPI backend for the Clinical Policy RAG dashboard.

Serves a custom single-page UI and exposes the RAG pipeline + change detector
as JSON endpoints. Reuses the exact same rag/ modules as the CLI.

Run:  uvicorn server:app --reload --port 8000
or:   python server.py
"""
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import config
from rag.pipeline import answer
from rag.store import get_collection
from rag.llm import list_models
from rag.change_detector import list_documents, read_document, detect_changes

app = FastAPI(title="Clinical Policy RAG")
WEB = Path(__file__).parent / "web"


def _chat_model():
    """Pick the first loaded non-embedding model from LM Studio."""
    for m in list_models():
        if "embed" not in m.lower():
            return m
    return config.LM_STUDIO_MODEL


class AskBody(BaseModel):
    query: str
    top_k: int = config.TOP_K


class DiffBody(BaseModel):
    v1: str
    v2: str


@app.get("/api/health")
def health():
    models = list_models()
    try:
        count = get_collection().count()
    except Exception:
        count = 0
    return {
        "connected": bool(models),
        "models": models,
        "chat_model": _chat_model() if models else None,
        "chunks": count,
    }


@app.get("/api/documents")
def documents():
    return {"documents": list_documents()}


_LLM_DOWN = (
    "Could not reach the LLM. Is LM Studio running with a model loaded and its "
    "server started (Developer -> Start Server)?"
)


@app.post("/api/ask")
def ask(body: AskBody):
    t0 = time.time()
    try:
        result = answer(body.query, top_k=body.top_k, model=_chat_model())
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"{_LLM_DOWN} ({exc})")
    result["elapsed"] = round(time.time() - t0, 2)
    return result


@app.post("/api/diff")
def diff(body: DiffBody):
    try:
        changes, raw = detect_changes(
            read_document(body.v1), read_document(body.v2),
            label_v1=body.v1, label_v2=body.v2, model=_chat_model(),
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"{_LLM_DOWN} ({exc})")
    return {"changes": changes, "raw": raw}


@app.get("/", response_class=HTMLResponse)
def index():
    return (WEB / "index.html").read_text(encoding="utf-8")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
