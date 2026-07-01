"""RAG orchestration: retrieve relevant policy chunks, then ground the LLM
answer in them with citations.

This is the core of the POC:
    query -> embed -> vector search -> build grounded prompt -> LLM -> answer + sources
"""
import config
from rag.store import get_collection
from rag.llm import chat

SYSTEM_PROMPT = (
    "You are a healthcare billing and coding policy assistant for payment-integrity "
    "analysts. Answer ONLY using the policy excerpts provided in the context. "
    "Cite the source filename in brackets after each claim, e.g. [telehealth_coverage_2025.md]. "
    "If the answer is not contained in the context, reply exactly: "
    "'Not found in the provided policy documents.' Do not invent codes, dates, or rules."
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


def _build_context(hits):
    blocks = []
    for h in hits:
        blocks.append(f"[{h['source']}] (relevance {h['score']})\n{h['text']}")
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
