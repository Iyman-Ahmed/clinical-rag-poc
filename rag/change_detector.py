"""Policy Change Detector.

Compares two versions of a billing/coding policy and emits a STRUCTURED diff —
not prose. This maps directly to Topic 3 ("comparison of content changes" and
"conversion of written policy into rules/features"): the JSON output is a
machine-actionable rule-delta a downstream system could act on.

The 'claim_impact' field is an ILLUSTRATIVE walkthrough, not a measured
adjudication result — see README / report for that distinction.
"""
import glob
import json
import os
import re

import config
from rag.llm import chat

CHANGE_SYSTEM = (
    "You are a healthcare billing-policy change analyst. You are given two versions "
    "of a policy and must output a STRUCTURED diff of the meaningful changes. "
    "For each change, produce an object with keys: "
    "'aspect' (what the rule is about), "
    "'old' (how version 1 handled it), "
    "'new' (how version 2 handles it), "
    "'change_type' (exactly one of: tightened, loosened, added, removed, clarified), "
    "and 'claim_impact' (one short, illustrative sentence on how it could affect "
    "claim adjudication). "
    "Output ONLY a valid JSON array of such objects, no prose, no code fences. "
    "If nothing meaningful changed, output []."
)


def list_documents(data_dir=config.DATA_DIR):
    """Return policy filenames available in the corpus."""
    paths = sorted(
        glob.glob(os.path.join(data_dir, "*.md"))
        + glob.glob(os.path.join(data_dir, "*.txt"))
    )
    return [os.path.basename(p) for p in paths]


def read_document(name, data_dir=config.DATA_DIR):
    with open(os.path.join(data_dir, name), "r", encoding="utf-8") as f:
        return f.read()


def _parse_json(raw):
    """Tolerantly extract a JSON array from the model output."""
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return []
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return []


def detect_changes(text_v1, text_v2, label_v1="v1", label_v2="v2", model=None):
    """Return (changes, raw_response). `changes` is a list of structured deltas."""
    user = (
        f"POLICY VERSION 1 ({label_v1}):\n{text_v1}\n\n"
        f"POLICY VERSION 2 ({label_v2}):\n{text_v2}\n\n"
        "Return the structured JSON diff now."
    )
    raw = chat(
        [
            {"role": "system", "content": CHANGE_SYSTEM},
            {"role": "user", "content": user},
        ],
        model=model,
        temperature=0.0,
    )
    return _parse_json(raw), raw
