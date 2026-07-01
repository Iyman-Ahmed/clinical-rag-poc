"""Document ingestion: load policy files -> chunk -> embed -> store.

Run directly to (re)build the index:
    python -m rag.ingest
"""
import glob
import os

import config
from rag.store import reset_collection


def _read_files(data_dir):
    """Yield (title, text) for every .md / .txt file in the corpus."""
    paths = sorted(
        glob.glob(os.path.join(data_dir, "*.md"))
        + glob.glob(os.path.join(data_dir, "*.txt"))
    )
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            yield os.path.basename(path), f.read()


def chunk_text(text, size=config.CHUNK_SIZE, overlap=config.CHUNK_OVERLAP):
    """Split text into overlapping windows.

    We split on paragraph boundaries first, then pack paragraphs into
    chunks up to `size` characters. Overlap keeps a sentence of context
    across boundaries so retrieval doesn't cut answers in half.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks, current = [], ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= size:
            current = f"{current}\n\n{para}".strip()
        else:
            if current:
                chunks.append(current)
            # carry the tail of the previous chunk for context continuity
            tail = current[-overlap:] if current else ""
            current = f"{tail}\n\n{para}".strip() if tail else para
    if current:
        chunks.append(current)
    return chunks


def build_index(data_dir=config.DATA_DIR):
    """Wipe and rebuild the vector index from the corpus on disk."""
    collection = reset_collection()
    ids, documents, metadatas = [], [], []

    for title, text in _read_files(data_dir):
        for i, chunk in enumerate(chunk_text(text)):
            ids.append(f"{title}::chunk{i}")
            documents.append(chunk)
            metadatas.append({"source": title, "chunk": i})

    if not documents:
        raise SystemExit(
            f"No documents found in '{data_dir}'. Add .md/.txt policy files first."
        )

    # Chroma embeds and stores in one call.
    collection.add(ids=ids, documents=documents, metadatas=metadatas)
    return {"files": len({m['source'] for m in metadatas}), "chunks": len(documents)}


if __name__ == "__main__":
    stats = build_index()
    print(f"Indexed {stats['chunks']} chunks from {stats['files']} policy documents.")
