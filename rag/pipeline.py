"""RAG orchestration: retrieve relevant policy chunks, then ground the LLM
answer in them with citations.

This is the core of the POC:
    query -> embed -> vector search -> build grounded prompt -> LLM -> answer + sources
"""
import os

import config
from rag.store import get_collection
from rag.llm import chat

SYSTEM_PROMPT = (
    "You are a healthcare billing and coding policy assistant for payment-integrity "
    "analysts. Answer using ONLY the policy excerpts provided in the context.\n\n"
    "HOW TO REASON:\n"
    "- The excerpts contain rules that must be COMBINED: covered indications, a timing "
    "rule (imaging is generally not necessary in the first month of symptoms unless a "
    "red-flag condition exists), and documentation requirements (indication, symptom "
    "duration, conservative treatment attempted).\n"
    "- When the question describes a patient scenario, apply these rules step by step: "
    "state which criteria are met and which are not, then give a clear determination.\n\n"
    "WHAT COUNTS AS AN ANSWER vs A REFUSAL:\n"
    "- Concluding that a service is NOT covered or NOT medically necessary is a VALID, "
    "expected ANSWER. Give it directly, e.g. 'No — a lumbar MRI is not medically "
    "necessary here, because the symptoms are within the first month, there are no red "
    "flags, and no conservative treatment has been attempted [mri_lumbar_spine_lcd.md].'\n"
    "- Do NOT use the phrase 'Not found in the provided policy documents' for a 'No' or "
    "'does not qualify' determination — that is an answer, not a refusal.\n"
    "- Reserve the exact reply 'Not found in the provided policy documents.' ONLY for "
    "questions whose subject matter is genuinely absent from the excerpts (for example, "
    "a question unrelated to these healthcare policies).\n\n"
    "Cite the source filename in brackets after each supporting statement, e.g. "
    "[mri_lumbar_spine_lcd.md]. Never invent codes, dates, or rules that are not in the context."
)


def retrieve(query, top_k=config.TOP_K):
    """Return the top-k policy chunks for a query with similarity scores."""
    collection = get_collection()
    res = collection.query(query_texts=[query], n_results=top_k)
    hits = []
    for doc, meta, dist in zip(
        res["documents"][0], res["metadatas"][0], res["distances"][0]
    ):
        hits.append(
            {
                "text": doc,
                "source": meta["source"],
                "chunk": meta["chunk"],
                # cosine distance -> similarity (1.0 = identical)
                "score": round(1 - dist, 3),
            }
        )
    return hits


def _load_full_document(source):
    """Read the entire source policy file so the LLM sees every section together
    (parent-document expansion). Returns None if the file can't be read."""
    try:
        with open(os.path.join(config.DATA_DIR, source), "r", encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return None


def _build_context(hits):
    """Expand each retrieved chunk to its whole source document (deduped, in rank
    order). Because policy files are small, this keeps multi-section rules — e.g.
    an indication AND its timing exception — in the same context so the model can
    combine them instead of seeing only one chunk."""
    best_score = {}
    for h in hits:
        if h["source"] not in best_score:  # hits are in rank order; keep the top score
            best_score[h["source"]] = h["score"]

    blocks = []
    for source, score in best_score.items():
        full = _load_full_document(source)
        if full is None:  # fall back to the retrieved chunk text
            full = "\n\n".join(h["text"] for h in hits if h["source"] == source)
        blocks.append(f"[{source}] (relevance {score})\n{full}")
    return "\n\n---\n\n".join(blocks)


def answer(query, top_k=config.TOP_K, model=None):
    """Full RAG turn. Returns the grounded answer plus the sources used."""
    hits = retrieve(query, top_k=top_k)
    context = _build_context(hits)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {query}",
        },
    ]
    text = chat(messages, model=model)
    return {"answer": text, "sources": hits}
