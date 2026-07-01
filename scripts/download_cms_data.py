"""Optional: pull additional real CMS source documents into data/policies/.

The repo already ships with hand-curated CMS-style excerpts so the demo works
offline with zero setup. Run this only if you want to expand the corpus with
larger public-domain CMS files.

    python scripts/download_cms_data.py

Public, no-signup CMS resources you can add:
  - National Coverage Determinations (NCD) — cms.gov
  - Local Coverage Determinations (LCD)     — cms.gov MCD
  - ICD-10-CM code descriptions             — cms.gov/medicare/coding-billing/icd-10-codes
  - Medicare Claims Processing Manual        — cms.gov manuals

This stub keeps the POC dependency-light. Add URLs below if you want automation.
"""
import os
import urllib.request

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "policies")

# Map of {filename: url}. Left empty by design — the bundled corpus is enough
# for the demo. Populate with direct links to .txt/.html CMS files to expand.
SOURCES = {
    # "ncd_example.txt": "https://www.cms.gov/...",
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if not SOURCES:
        print("No extra sources configured. Bundled corpus is ready to use.")
        print("Add entries to SOURCES in this file to auto-download CMS docs.")
        return
    for name, url in SOURCES.items():
        dest = os.path.join(OUT_DIR, name)
        print(f"Downloading {name} …")
        urllib.request.urlretrieve(url, dest)
    print("Done. Re-run:  python -m rag.ingest")


if __name__ == "__main__":
    main()
