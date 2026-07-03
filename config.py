"""Central configuration. Everything is overridable via environment variables
so nothing is hard-coded for the demo machine."""
import os
from pathlib import Path

# Anchor all paths to this file's directory so the app works regardless of the
# current working directory (CLI, uvicorn --app-dir, preview server, etc.).
_ROOT = Path(__file__).resolve().parent

# --- LM Studio (OpenAI-compatible local server) ---
# Start LM Studio -> Developer -> Start Server. Default endpoint below.
LM_STUDIO_BASE_URL = os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1")
LM_STUDIO_API_KEY = os.getenv("LM_STUDIO_API_KEY", "lm-studio")  # LM Studio ignores the value
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "local-model")    # any loaded model id works

# --- Embeddings (fully local, free, CPU-friendly) ---
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# --- Vector store ---
CHROMA_DIR = os.getenv("CHROMA_DIR", str(_ROOT / "chroma_db"))
COLLECTION_NAME = "clinical_policies"

# --- Corpus ---
DATA_DIR = os.getenv("DATA_DIR", str(_ROOT / "data" / "policies"))

# --- Chunking / retrieval ---
CHUNK_SIZE = 700        # characters per chunk
CHUNK_OVERLAP = 120     # overlap to preserve context across boundaries
TOP_K = 6               # how many chunks to retrieve per query (whole source docs are then expanded in)
