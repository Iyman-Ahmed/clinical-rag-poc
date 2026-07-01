"""Vector store layer.

ChromaDB holds the embeddings and runs the nearest-neighbour search.
We use cosine similarity (hnsw:space="cosine") so retrieval scores are
intuitive: closer to 1.0 = more relevant.

First-principles note: a "vector database" stores each text chunk as a
high-dimensional embedding, then finds the chunks whose vectors are
closest to the query's vector. That is the whole trick behind RAG.
"""
import chromadb
from chromadb.utils import embedding_functions

import config

# A single shared embedding function. SentenceTransformer downloads the
# model once (~80MB) and runs locally on CPU -> no API cost.
_embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name=config.EMBEDDING_MODEL
)


def get_collection():
    """Return a persistent Chroma collection, creating it if needed."""
    client = chromadb.PersistentClient(path=config.CHROMA_DIR)
    return client.get_or_create_collection(
        name=config.COLLECTION_NAME,
        embedding_function=_embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )


def reset_collection():
    """Drop and recreate the collection for a clean re-ingest."""
    client = chromadb.PersistentClient(path=config.CHROMA_DIR)
    try:
        client.delete_collection(config.COLLECTION_NAME)
    except Exception:
        pass
    return get_collection()
