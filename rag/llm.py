"""Thin client for the LM Studio local server.

LM Studio exposes an OpenAI-compatible API, so we reuse the official
`openai` SDK and just point it at localhost. No tokens leave the machine
and there is no per-request cost.
"""
from openai import OpenAI

import config


def get_client():
    return OpenAI(
        base_url=config.LM_STUDIO_BASE_URL,
        api_key=config.LM_STUDIO_API_KEY,
    )


def chat(messages, model=None, temperature=0.1):
    """Send a chat completion to LM Studio and return the text."""
    client = get_client()
    resp = client.chat.completions.create(
        model=model or config.LM_STUDIO_MODEL,
        messages=messages,
        temperature=temperature,
    )
    return resp.choices[0].message.content


def list_models():
    """Return loaded model ids (used to auto-detect what's in LM Studio)."""
    try:
        return [m.id for m in get_client().models.list().data]
    except Exception:
        return []
