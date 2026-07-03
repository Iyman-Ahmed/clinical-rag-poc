# 🩺 Clinical Policy RAG

**Ask questions about healthcare billing & coding policies and get answers with citations — running 100% on your own machine, at zero cost.**

Built as a hackathon proof-of-concept for the Cotiviti Generative AI intern assessment
(Topic 3 — *Content Management in Healthcare*).

---

## What it does

Payment-integrity analysts spend a lot of time looking things up in dense CMS/Medicare
policy documents ("Is an MRI of the lumbar spine covered? Which ICD-10 code applies?").
This tool does that lookup for you.

It has **two features**:

1. **Ask a policy question** → it finds the relevant policy text and gives you a plain-English
   answer **with citations** to the exact source document.
   If the answer isn't in the policies, it says so instead of making something up
   (an anti-hallucination guardrail — this is the important part for healthcare).

2. **Policy Change Detector** → give it two versions of a policy (e.g. telehealth rules for
   2024 vs 2025) and it produces a **structured list of what changed** — tightened, loosened,
   added, or removed — and how each change could affect a claim.

---

## How it works

It's a **RAG (Retrieval-Augmented Generation)** system. The whole flow is five steps:

```
your question
     │
     ▼
1. embed the question into a vector
     │
     ▼
2. search the vector database for the most relevant policy chunks   (ChromaDB)
     │
     ▼
3. build a prompt: "answer ONLY using these policy excerpts…"
     │
     ▼
4. send it to a local LLM                                           (LM Studio)
     │
     ▼
5. return the answer + the sources it used
```

The key idea: the LLM is **only allowed to answer from the retrieved policy text**, so every
answer is grounded and traceable — no invented codes or dates.

### The stack (kept deliberately simple)

| Part | Tool | Why |
|------|------|-----|
| LLM | **LM Studio** (local) | Free, private, no API keys — runs on your laptop |
| Embeddings | `all-MiniLM-L6-v2` | 80 MB, runs on CPU, free |
| Vector database | **ChromaDB** | Stores the policy chunks as vectors for fast search |
| Web app | **FastAPI** + a custom dashboard | Clean UI for the demo |
| Policy data | Real CMS policy excerpts | Works offline, out of the box |

Nothing leaves your machine and there are no usage costs.

---

## How to run it

**Prerequisites:** Python 3.10+ and [LM Studio](https://lmstudio.ai) installed.

```bash
# 1. Set up the environment
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Build the search index from the policy documents
python -m rag.ingest

# 3. Start LM Studio → load any chat model → Developer tab → Start Server
#    (it listens on http://localhost:1234 by default)

# 4. Launch the app
python server.py
```

Then open **http://localhost:8000** in your browser.

---

## Try these (demo script)

**Ask a policy question:**
1. *What are the coverage requirements for an MRI of the lumbar spine?* → grounded answer, cited to LCD L34220
2. *Which ICD-10 codes apply to type 2 diabetes with chronic kidney disease?* → exact code lookup (E11.22 + N18)
3. *Summarize the Medicare telehealth coverage policy for 2025.* → summarization
4. *What is the capital of France?* → **"Not found in the provided policy documents."** ← the guardrail in action

**Policy Change Detector:**
5. Compare `telehealth_coverage_2024.md` vs `telehealth_coverage_2025.md` → structured list of changes

**Claim adjudication (payment-integrity use case):**
The corpus includes two **synthetic** sample claims (no real PHI) — `claim_mri_lumbar_2041.md`
(compliant) and `claim_mri_lumbar_2042.md` (missing conservative-care documentation). Ask:
6. *Based on the coverage policy, is the lumbar MRI (CPT 72148) on claim CLM-2041 medically necessary?* → **payable** (indication + duration + conservative care all documented)
7. *As a payment-integrity reviewer, evaluate claim CLM-2042 for the lumbar MRI against the coverage policy.* → **flagged / likely deny** (no conservative treatment documented). This is the core Cotiviti workflow: judging a claim against policy, with the evidence shown.

---

## Project layout

```
clinical-rag-poc/
├── server.py              # FastAPI backend + serves the web UI
├── web/index.html         # the dashboard (single page)
├── config.py              # all settings (paths, model, chunk size)
├── rag/
│   ├── ingest.py          # load → chunk → embed → store the policies
│   ├── store.py           # ChromaDB vector database
│   ├── llm.py             # talks to LM Studio
│   ├── pipeline.py        # the RAG flow: retrieve → ground → answer
│   └── change_detector.py # compares two policy versions
├── data/policies/         # the CMS policy documents (.md)
├── report/                # the written assessment report
└── SOURCES.md             # where every policy document came from
```

---

## A note on the data

Every file in `data/policies/` starts with a `SOURCE:` header citing the real CMS document it
summarizes (with URL and retrieval date) — see [SOURCES.md](SOURCES.md). The content is
condensed for the demo. The "claim impact" field in the Change Detector is an *illustrative*
explanation, not a real adjudication result.

---

## What this project cannot do

The prototype reliably answers direct policy questions and reasons through clinical scenarios
that combine several rules **within** a policy — for example, weighing symptom duration, red
flags, and conservative treatment together to reach a determination. Reasoning that spans
**separate** policy documents is the current edge; it would benefit from a reranker, improved
retrieval, or agentic reasoning in future iterations.

---

## Why this fits Cotiviti

This mirrors how a payment-integrity analyst works with a living policy library: **instant,
cited answers** over billing/coding rules, a **guardrail** against hallucination, and full
**transparency** — the dashboard always shows the exact evidence used to answer.
