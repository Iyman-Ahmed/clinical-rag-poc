"""Clinical Policy RAG — Streamlit dashboard.

Run:  streamlit run app.py

Two modes:
  1. Ask a policy question  — RAG with citations + anti-hallucination guardrail.
  2. Policy Change Detector — structured diff between two policy versions.
"""
import os
import time

import streamlit as st

import config
from rag.pipeline import answer
from rag.ingest import build_index
from rag.store import get_collection
from rag.llm import list_models
from rag.change_detector import list_documents, read_document, detect_changes

st.set_page_config(page_title="Clinical Policy RAG", page_icon="🩺", layout="wide")

# ---------- styling: clean, branded, demo-ready ----------
st.markdown(
    """
    <style>
      .stApp { background: #0f1117; }
      h1, h2, h3, h4, p, label, span, div { color: #e6e8ee; }
      .hero {
        background: linear-gradient(135deg, #6d28d9 0%, #db2777 100%);
        padding: 22px 28px; border-radius: 14px; margin-bottom: 18px;
      }
      .hero h1 { margin: 0; font-size: 26px; color: #fff; }
      .hero p { margin: 6px 0 0; color: #f3e8ff; font-size: 14px; }
      .answer-card {
        background: #1a1d27; border: 1px solid #2a2f3e; border-left: 4px solid #8b5cf6;
        border-radius: 12px; padding: 20px 24px; margin-top: 8px;
      }
      .src-pill {
        display: inline-block; background: #2a1f4d; color: #c4b5fd;
        border: 1px solid #4c1d95; border-radius: 999px;
        padding: 3px 12px; margin: 3px 4px 3px 0; font-size: 12px;
      }
      .metric-box {
        background: #1a1d27; border: 1px solid #2a2f3e; border-radius: 12px;
        padding: 14px 16px; text-align: center;
      }
      .metric-box .v { font-size: 24px; font-weight: 700; color: #a78bfa; }
      .metric-box .l { font-size: 12px; color: #8b91a3; }
      .chunk {
        background: #14171f; border: 1px solid #262b38; border-radius: 8px;
        padding: 12px 14px; margin-bottom: 8px; font-size: 13px; color: #c7ccd9;
      }
      .score { color: #34d399; font-weight: 600; }
      .badge { border-radius: 6px; padding: 2px 9px; font-size: 12px; font-weight: 600;
               background:#2a2440; color:#c4b5fd; border:1px solid #4c1d95; }
      .b-tightened { background:#3b1d1d; color:#fca5a5; border:1px solid #7f1d1d; }
      .b-loosened  { background:#11301f; color:#86efac; border:1px solid #14532d; }
      .b-added     { background:#10243b; color:#93c5fd; border:1px solid #1e3a5f; }
      .b-removed   { background:#2b2b2b; color:#d4d4d4; border:1px solid #525252; }
      .b-clarified { background:#2a2440; color:#c4b5fd; border:1px solid #4c1d95; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    """
    <div class="hero">
      <h1>🩺 Clinical Policy RAG</h1>
      <p>Grounded answers and structured change-detection over real CMS-cited
      billing &amp; coding policy. Runs fully local on LM Studio — zero API cost.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

# ---------- sidebar: config + corpus status ----------
with st.sidebar:
    st.subheader("⚙️ Engine")
    base_url = st.text_input("LM Studio URL", config.LM_STUDIO_BASE_URL)
    os.environ["LM_STUDIO_BASE_URL"] = base_url
    config.LM_STUDIO_BASE_URL = base_url

    detected = list_models()
    if detected:
        model = st.selectbox("Loaded model", detected)
        st.success("LM Studio connected")
    else:
        model = st.text_input("Model id", config.LM_STUDIO_MODEL)
        st.warning("No server detected — start LM Studio's local server")

    top_k = st.slider("Chunks retrieved (k)", 1, 8, config.TOP_K)

    st.divider()
    st.subheader("📚 Knowledge base")
    try:
        count = get_collection().count()
    except Exception:
        count = 0
    st.markdown(f"**{count}** policy chunks indexed")
    if st.button("🔁 Rebuild index"):
        with st.spinner("Embedding documents…"):
            stats = build_index()
        st.success(f"Indexed {stats['chunks']} chunks / {stats['files']} files")
        st.rerun()

tab_ask, tab_diff = st.tabs(["🔎 Ask a policy question", "🔀 Policy Change Detector"])

# =====================================================================
# TAB 1 — RAG Q&A
# =====================================================================
with tab_ask:
    SAMPLES = [
        "What are the coverage requirements for an MRI of the lumbar spine?",
        "Which ICD-10 codes apply to type 2 diabetes with chronic kidney disease?",
        "Summarize the Medicare telehealth coverage policy for 2025.",
        "When is a skilled nursing facility stay covered by Medicare?",
    ]

    st.markdown("#### Try a question")
    cols = st.columns(2)
    clicked = None
    for i, q in enumerate(SAMPLES):
        if cols[i % 2].button(q, use_container_width=True, key=f"s{i}"):
            clicked = q

    query = st.text_input(
        "Ask a policy question",
        value=clicked or "",
        placeholder="e.g. What documentation is required to bill a telehealth visit?",
    )

    if st.button("🔍 Answer", type="primary"):
        if not query.strip():
            st.info("Type a question or pick a sample above.")
        elif count == 0:
            st.error("Index is empty — click 'Rebuild index' in the sidebar first.")
        else:
            with st.spinner("Retrieving policy and reasoning…"):
                t0 = time.time()
                try:
                    result = answer(query, top_k=top_k, model=model)
                except Exception as e:
                    st.error(f"LLM call failed — is LM Studio's server running? ({e})")
                    st.stop()
                elapsed = time.time() - t0

            st.markdown("#### Answer")
            st.markdown(result["answer"])  # render markdown properly

            srcs = []
            for h in result["sources"]:
                tag = f"{h['source']} · {h['score']}"
                if tag not in srcs:
                    srcs.append(tag)
            st.markdown(
                "<div style='margin-top:10px'>"
                + "".join(f"<span class='src-pill'>{s}</span>" for s in srcs)
                + "</div>",
                unsafe_allow_html=True,
            )

            m1, m2, m3 = st.columns(3)
            m1.markdown(
                f"<div class='metric-box'><div class='v'>{len(result['sources'])}</div>"
                "<div class='l'>chunks retrieved</div></div>",
                unsafe_allow_html=True,
            )
            m2.markdown(
                f"<div class='metric-box'><div class='v'>{result['sources'][0]['score']}</div>"
                "<div class='l'>top relevance</div></div>",
                unsafe_allow_html=True,
            )
            m3.markdown(
                f"<div class='metric-box'><div class='v'>{elapsed:.1f}s</div>"
                "<div class='l'>response time</div></div>",
                unsafe_allow_html=True,
            )

            with st.expander("🔎 Retrieved evidence (what the model actually saw)"):
                for h in result["sources"]:
                    st.markdown(
                        f"<div class='chunk'><span class='score'>relevance {h['score']}</span> "
                        f"— <b>{h['source']}</b> (chunk {h['chunk']})<br>{h['text']}</div>",
                        unsafe_allow_html=True,
                    )

# =====================================================================
# TAB 2 — Policy Change Detector
# =====================================================================
with tab_diff:
    st.markdown("#### Compare two policy versions → structured rule-delta")
    st.caption(
        "Maps to Topic 3: *comparison of content changes* and *conversion of "
        "written policy into rules*. `claim_impact` is illustrative, not a measured "
        "adjudication result."
    )

    docs = list_documents()
    if len(docs) < 2:
        st.info("Need at least two policy documents in the corpus.")
    else:
        # sensible defaults: the two telehealth versions
        d1_default = next((i for i, d in enumerate(docs) if "2024" in d), 0)
        d2_default = next((i for i, d in enumerate(docs) if "2025" in d), 1)
        c1, c2 = st.columns(2)
        v1 = c1.selectbox("Version 1 (older)", docs, index=d1_default)
        v2 = c2.selectbox("Version 2 (newer)", docs, index=d2_default)

        if st.button("🔀 Detect changes", type="primary"):
            if v1 == v2:
                st.warning("Pick two different documents.")
            else:
                with st.spinner("Analyzing policy delta…"):
                    try:
                        changes, raw = detect_changes(
                            read_document(v1), read_document(v2),
                            label_v1=v1, label_v2=v2, model=model,
                        )
                    except Exception as e:
                        st.error(f"LLM call failed — is LM Studio running? ({e})")
                        st.stop()

                if not changes:
                    st.warning("No structured changes parsed. Raw model output:")
                    st.code(raw)
                else:
                    st.success(f"{len(changes)} change(s) detected")
                    for ch in changes:
                        ct = str(ch.get("change_type", "clarified")).lower()
                        st.markdown(
                            f"<div class='answer-card'>"
                            f"<span class='badge b-{ct}'>{ct.upper()}</span> "
                            f"<b>{ch.get('aspect','')}</b><br><br>"
                            f"<b>Was:</b> {ch.get('old','')}<br>"
                            f"<b>Now:</b> {ch.get('new','')}<br><br>"
                            f"<i>Claim impact (illustrative):</i> {ch.get('claim_impact','')}"
                            f"</div>",
                            unsafe_allow_html=True,
                        )
                    with st.expander("🧩 Raw structured JSON (machine-actionable)"):
                        st.json(changes)

st.caption("POC for Cotiviti — Topic 3: Content Management in Healthcare. Local, zero-cost RAG.")
