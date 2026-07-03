// Clinical Policy RAG — deck rebuild (dark "AI-engineer" design system)
// Run: node build_deck.mjs
import PptxGenJS from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(DIR, "shots");
const OUT = path.join(DIR, "Clinical_Policy_RAG.pptx");

// ---- design tokens (light theme) ----
const BG = "F7F8FA", BG2 = "F1ECFD", PANEL = "FFFFFF", LINE = "E4E7ED";
const INK = "16171F", MUTED = "5C6472", DIM = "9AA0AC";
const VIOLET = "6D28D9", MAGENTA = "DB2777", GREEN = "059669", RED = "DC2626", AMBER = "D97706";
const F_MONO = "Courier New", F_HEAD = "Arial", F_BODY = "Calibri";

const W = 13.333, H = 7.5, M = 0.62, CW = W - 2 * M;
const NSLIDES = 15;

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "W16", width: W, height: H });
pptx.layout = "W16";
pptx.author = "Iyman Ahmed";
pptx.title = "Clinical Policy RAG";
const R = pptx.ShapeType.roundRect, RECT = pptx.ShapeType.rect, LN = pptx.ShapeType.line;

// pixel dims for aspect-correct placement
const PX = {
  "answer_mri.png": [1920, 1378],
  "guardrail.png": [1920, 574],
  "scenario_2week_card.png": [1952, 508],
  "claim_2041_approve.png": [1952, 1456],
  "claim_2042_deny.png": [1952, 2246],
  "change_detector.png": [1920, 2636],
};

// ---- helpers ----
const footer = (s, idx) => {
  s.addText("CLINICAL POLICY RAG", { x: M, y: 7.02, w: 6, h: 0.3, fontFace: F_MONO, fontSize: 8, color: DIM, charSpacing: 2 });
  s.addText(`${String(idx).padStart(2, "0")} / ${NSLIDES}`, { x: W - M - 1.6, y: 7.02, w: 1.6, h: 0.3, fontFace: F_MONO, fontSize: 8, color: DIM, align: "right" });
};
const base = (s, kicker, title, idx, titleRuns) => {
  s.background = { color: BG };
  // faint accent tick before kicker
  s.addShape(RECT, { x: M, y: 0.53, w: 0.16, h: 0.16, fill: { color: VIOLET } });
  s.addText(kicker, { x: M + 0.28, y: 0.46, w: CW - 0.28, h: 0.3, fontFace: F_MONO, fontSize: 11, color: VIOLET, bold: true, charSpacing: 2 });
  s.addText(titleRuns || title, { x: M, y: 0.82, w: CW, h: 0.9, fontFace: F_HEAD, fontSize: 29, bold: true, color: INK, lineSpacing: 32 });
  footer(s, idx);
};
const fit = (name, boxW, boxH) => {
  const [pw, ph] = PX[name]; const ar = pw / ph;
  let w = boxW, h = boxW / ar; if (h > boxH) { h = boxH; w = boxH * ar; }
  return { w, h };
};
const shot = (s, name, box) => {
  const { x, y, w: bw, h: bh } = box; const f = fit(name, bw, bh);
  const ix = x + (bw - f.w) / 2, iy = y + (bh - f.h) / 2, pad = 0.11;
  s.addShape(R, { x: ix - pad, y: iy - pad, w: f.w + 2 * pad, h: f.h + 2 * pad, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 }, rectRadius: 0.08, shadow: { type: "outer", color: "8A93A6", opacity: 0.3, blur: 11, offset: 3, angle: 90 } });
  s.addImage({ path: path.join(SHOTS, name), x: ix, y: iy, w: f.w, h: f.h });
};
const card = (s, x, y, w, h, fill = PANEL) => s.addShape(R, { x, y, w, h, fill: { color: fill }, line: { color: LINE, width: 1 }, rectRadius: 0.07, shadow: { type: "outer", color: "9AA3B2", opacity: 0.22, blur: 8, offset: 2, angle: 90 } });
const pill = (s, x, y, w, label, col = VIOLET) => {
  s.addShape(R, { x, y, w, h: 0.42, fill: { color: PANEL }, line: { color: col, width: 1 }, rectRadius: 0.21 });
  s.addText(label, { x, y, w, h: 0.42, fontFace: F_MONO, fontSize: 10.5, color: INK, align: "center", valign: "middle", charSpacing: 1 });
};
const note = (s, txt, y = 6.35) =>
  s.addText(txt, { x: M, y, w: CW, h: 0.5, fontFace: F_BODY, fontSize: 13, italic: true, color: MUTED, align: "center", lineSpacing: 16 });

// ============================================================ 1 · TITLE
{
  const s = pptx.addSlide(); s.background = { color: BG };
  // large ghosted index / brand mark
  s.addShape(R, { x: M, y: 2.35, w: 0.9, h: 0.9, fill: { color: VIOLET }, rectRadius: 0.22, shadow: { type: "outer", color: MAGENTA, opacity: 0.28, blur: 16, offset: 0, angle: 0 } });
  s.addText("◆", { x: M, y: 2.35, w: 0.9, h: 0.9, fontFace: F_HEAD, fontSize: 30, color: "FFFFFF", align: "center", valign: "middle" });
  s.addShape(RECT, { x: M + 0.02, y: 1.65, w: 0.16, h: 0.16, fill: { color: VIOLET } });
  s.addText("PROOF OF CONCEPT · COTIVITI GENAI INTERN ASSESSMENT", { x: M + 0.3, y: 1.58, w: 11, h: 0.3, fontFace: F_MONO, fontSize: 12, color: VIOLET, bold: true, charSpacing: 2 });
  s.addText("Clinical Policy RAG", { x: M, y: 3.35, w: 12, h: 1.05, fontFace: F_HEAD, fontSize: 54, bold: true, color: INK });
  s.addText(
    "Source-grounded answers, claim adjudication, and a working guardrail over healthcare\nbilling & coding policy — 100% local, $0 cost.",
    { x: M, y: 4.5, w: 11.2, h: 0.9, fontFace: F_BODY, fontSize: 17, color: MUTED, lineSpacing: 24 });
  s.addShape(LN, { x: M, y: 5.75, w: 4.0, h: 0, line: { color: LINE, width: 1 } });
  s.addText([
    { text: "Iyman Ahmed", options: { bold: true, color: INK } },
    { text: "   ·   Topic 3 — Content Management in Health Care", options: { color: MUTED } },
  ], { x: M, y: 5.95, w: 12, h: 0.4, fontFace: F_BODY, fontSize: 14 });
  s.addText("github.com/Iyman-Ahmed/clinical-rag-poc", { x: M, y: 6.4, w: 12, h: 0.3, fontFace: F_MONO, fontSize: 11, color: DIM });
}

// ============================================================ 2 · TOPIC / PROBLEM
{
  const s = pptx.addSlide();
  base(s, "THE TOPIC — CONTENT MANAGEMENT IN HEALTH CARE", "Policy is dense, always changing, and unforgiving.", 2);
  s.addText(
    "Payment-integrity analysts read long CMS and Medicare policy documents to answer routine questions — is this service covered, which code applies, what changed this year. Getting it wrong is costly. And an AI that confidently invents a code or a coverage rule isn’t a shortcut — it’s a compliance liability.",
    { x: M, y: 1.95, w: CW, h: 1.1, fontFace: F_BODY, fontSize: 15.5, color: MUTED, lineSpacing: 22 });
  const cards = [
    ["Billing & coding policies", "LCDs, NCDs, CPT/ICD-10 rules that decide payment."],
    ["Clinical practice guidelines", "Evidence-based criteria for medical necessity."],
    ["Payer–provider contracts", "Terms that must be read, compared, and enforced."],
  ];
  const cw = (CW - 0.6) / 3;
  cards.forEach(([t, d], i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 3.5, cw, 2.4);
    s.addShape(RECT, { x: x + 0.32, y: 3.85, w: 0.14, h: 0.14, fill: { color: [VIOLET, MAGENTA, AMBER][i] } });
    s.addText(t, { x: x + 0.32, y: 4.05, w: cw - 0.6, h: 0.7, fontFace: F_HEAD, fontSize: 15.5, bold: true, color: INK, lineSpacing: 19 });
    s.addText(d, { x: x + 0.32, y: 4.85, w: cw - 0.6, h: 0.9, fontFace: F_BODY, fontSize: 12.5, color: MUTED, lineSpacing: 17 });
  });
}

// ============================================================ 3 · TRENDS
{
  const s = pptx.addSlide();
  base(s, "WHERE THE FIELD IS GOING", "From keyword search to grounded reasoning.", 3);
  const items = [
    ["01", "NLP → LLMs & LMMs", "Extraction, summarization and coding shift from brittle rules to general-purpose models."],
    ["02", "RAG as the trust layer", "Retrieval grounds every answer in the source text, with citations — not model memory."],
    ["03", "Policy-as-code & agents", "Written policy is converted into rules, features, and models; agents chain the reasoning."],
    ["04", "Guardrails & auditability", "Refusal, provenance and evaluation are now table stakes for healthcare AI."],
  ];
  const cw = (CW - 0.5) / 2, ch = 1.9;
  items.forEach(([n, t, d], i) => {
    const x = M + (i % 2) * (cw + 0.5), y = 2.15 + Math.floor(i / 2) * (ch + 0.35);
    card(s, x, y, cw, ch);
    s.addText(n, { x: x + 0.3, y: y + 0.28, w: 1, h: 0.5, fontFace: F_MONO, fontSize: 15, bold: true, color: VIOLET });
    s.addText(t, { x: x + 1.05, y: y + 0.28, w: cw - 1.3, h: 0.5, fontFace: F_HEAD, fontSize: 16, bold: true, color: INK });
    s.addText(d, { x: x + 1.05, y: y + 0.78, w: cw - 1.35, h: 0.95, fontFace: F_BODY, fontSize: 12.5, color: MUTED, lineSpacing: 17 });
  });
}

// ============================================================ 4 · POC OVERVIEW
{
  const s = pptx.addSlide();
  base(s, "THE PROOF OF CONCEPT", "A grounded policy assistant you can actually audit.", 4);
  s.addText(
    "One small system that answers policy questions with citations, judges real claims against coverage rules, and flags what changed between policy versions — with a guardrail that refuses when the evidence isn’t there.",
    { x: M, y: 1.95, w: CW, h: 1.0, fontFace: F_BODY, fontSize: 15.5, color: MUTED, lineSpacing: 22 });
  const pills = [
    ["Cited Q&A", VIOLET], ["Hallucination guardrail", MAGENTA], ["Claim adjudication", GREEN],
    ["Multi-policy reasoning", AMBER], ["Policy change detector", VIOLET],
  ];
  let x = M, y = 3.25;
  const widths = [2.1, 3.3, 2.9, 3.2, 3.1];
  pills.forEach(([l, c], i) => {
    if (x + widths[i] > M + CW) { x = M; y += 0.62; }
    pill(s, x, y, widths[i], l, c); x += widths[i] + 0.25;
  });
  // three big stat callouts
  const stats = [["$0", "API / inference cost"], ["100%", "local & private"], ["6", "policy corpora indexed"]];
  const sw = (CW - 0.6) / 3;
  stats.forEach(([v, l], i) => {
    const sx = M + i * (sw + 0.3);
    card(s, sx, 4.7, sw, 1.5);
    s.addText(v, { x: sx, y: 4.9, w: sw, h: 0.7, fontFace: F_HEAD, fontSize: 34, bold: true, color: INK, align: "center" });
    s.addText(l, { x: sx, y: 5.62, w: sw, h: 0.4, fontFace: F_MONO, fontSize: 10.5, color: MUTED, align: "center", charSpacing: 1 });
  });
}

// ============================================================ 5 · HOW IT WORKS
{
  const s = pptx.addSlide();
  base(s, "HOW IT WORKS", "Retrieve → ground → cite. Nothing is invented.", 5);
  const steps = [
    ["1", "Embed", "the question"], ["2", "Search", "ChromaDB vectors"], ["3", "Ground", "whole source docs"],
    ["4", "Reason", "local LLM"], ["5", "Answer", "+ cited sources"],
  ];
  const bw = (CW - 4 * 0.45) / 5, by = 2.7, bh = 1.7;
  steps.forEach(([n, t, d], i) => {
    const x = M + i * (bw + 0.45);
    card(s, x, by, bw, bh);
    s.addShape(R, { x: x + bw / 2 - 0.28, y: by + 0.28, w: 0.56, h: 0.56, fill: { color: BG2 }, line: { color: VIOLET, width: 1.25 }, rectRadius: 0.28 });
    s.addText(n, { x: x + bw / 2 - 0.28, y: by + 0.28, w: 0.56, h: 0.56, fontFace: F_MONO, fontSize: 16, bold: true, color: VIOLET, align: "center", valign: "middle" });
    s.addText(t, { x, y: by + 0.98, w: bw, h: 0.35, fontFace: F_HEAD, fontSize: 14, bold: true, color: INK, align: "center" });
    s.addText(d, { x: x + 0.05, y: by + 1.32, w: bw - 0.1, h: 0.32, fontFace: F_BODY, fontSize: 10.5, color: MUTED, align: "center" });
    if (i < 4) s.addText("→", { x: x + bw + 0.03, y: by, w: 0.4, h: bh, fontFace: F_HEAD, fontSize: 18, color: DIM, align: "center", valign: "middle" });
  });
  s.addText(
    "The model is only allowed to answer from the retrieved policy text — so every answer is grounded, traceable, and free of invented codes or dates.",
    { x: M, y: 4.95, w: CW, h: 0.7, fontFace: F_BODY, fontSize: 14, italic: true, color: MUTED, align: "center", lineSpacing: 19 });
}

// ============================================================ 6 · ARCHITECTURE
{
  const s = pptx.addSlide();
  base(s, "ARCHITECTURE & STACK", "Four small, swappable, well-known parts.", 6);
  const parts = [
    ["LM Studio", "Local LLM — no API keys, no per-token cost."],
    ["ChromaDB", "Persistent vector store over policy chunks."],
    ["all-MiniLM-L6-v2", "80 MB embeddings, CPU-friendly, free."],
    ["FastAPI + dashboard", "Thin backend, one UI, same rag/ core."],
  ];
  const cw = (CW - 0.9) / 4;
  parts.forEach(([t, d], i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 2.15, cw, 2.5);
    s.addShape(RECT, { x: x + 0.28, y: 2.45, w: 0.14, h: 0.14, fill: { color: VIOLET } });
    s.addText(t, { x: x + 0.28, y: 2.66, w: cw - 0.5, h: 0.7, fontFace: F_HEAD, fontSize: 14.5, bold: true, color: INK, lineSpacing: 18 });
    s.addText(d, { x: x + 0.28, y: 3.45, w: cw - 0.52, h: 1.0, fontFace: F_BODY, fontSize: 12, color: MUTED, lineSpacing: 16 });
  });
  const tags = ["LOCAL", "FREE", "PRIVATE", "REPRODUCIBLE"];
  let x = M;
  tags.forEach((t) => { const w = 0.5 + t.length * 0.13; pill(s, x, 5.25, w, t, MAGENTA); x += w + 0.28; });
}

// ---- demo slide factory ----
const demo = (idx, kicker, title, titleRuns, name, box, noteTxt) => {
  const s = pptx.addSlide();
  base(s, kicker, title, idx, titleRuns);
  shot(s, name, box);
  if (noteTxt) note(s, noteTxt);
  return s;
};

// 7 · CITED ANSWER
demo(7, "LIVE DEMO · CITED ANSWER", "Every claim in the answer, traced to a source.", null,
  "answer_mri.png", { x: M, y: 1.85, w: CW, h: 4.35 },
  "LIVE APP — “Coverage requirements for a lumbar spine MRI?” → grounded answer, cited to LCD L34220.");

// 8 · GUARDRAIL
demo(8, "LIVE DEMO · THE GUARDRAIL", "It refuses before it lies.", null,
  "guardrail.png", { x: M, y: 2.15, w: CW, h: 3.7 },
  "LIVE APP — asked “What is the capital of France?” → negative relevance → the system says so instead of guessing.");

// 9 · MULTI-POLICY REASONING
demo(9, "LIVE DEMO · MULTI-POLICY REASONING",
  "It combines the rules to reach a determination.", null,
  "scenario_2week_card.png", { x: M, y: 2.2, w: CW, h: 3.5 },
  "LIVE APP — 2 weeks of pain, no red flags, no conservative care. A reviewer flagged this exact case; retrieval + prompt fixes now reason it to a grounded “No.”");

// 10 · CLAIM PAYABLE
demo(10, "LIVE DEMO · CLAIM ADJUDICATION",
  null, [{ text: "CLM-2041 — ", options: { color: INK } }, { text: "Payable.", options: { color: GREEN } }],
  "claim_2041_approve.png", { x: M, y: 1.85, w: CW, h: 4.35 },
  "Indication, symptom duration, and conservative care are all documented — the tool confirms medical necessity and cites the policy line.");

// 11 · CLAIM DENY  (tall shot — maximize height, no bottom caption)
demo(11, "LIVE DEMO · CLAIM ADJUDICATION · CLM-2042 = FLAG / DENY",
  null, [{ text: "CLM-2042 — ", options: { color: INK } }, { text: "Flag / Deny.", options: { color: RED } }],
  "claim_2042_deny.png", { x: M, y: 1.66, w: CW, h: 5.06 });

// 12 · CHANGE DETECTOR  (tall shot — maximize height, no bottom caption)
demo(12, "LIVE DEMO · POLICY CHANGE DETECTOR · telehealth 2024 → 2025",
  "Every revision becomes a structured, plain-English diff.", null,
  "change_detector.png", { x: M, y: 1.66, w: CW, h: 5.06 });

// ============================================================ 13 · VALUE FOR COTIVITI
{
  const s = pptx.addSlide();
  base(s, "FOR COTIVITI — OPPORTUNITY, RISK, RECOMMENDATION", "Where this creates value — and where to be careful.", 13);
  const colW = (CW - 0.5) / 2;
  const cols = [
    ["OPPORTUNITIES", GREEN, [
      "Research compresses from minutes to seconds, every answer cited.",
      "Claim-vs-policy adjudication with the evidence shown — the core workflow.",
      "Automatic monitoring of policy revisions across a living rule library.",
    ]],
    ["THREATS / RISKS", RED, [
      "Hallucinated codes or rules — a compliance liability if ungrounded.",
      "Stale policy: answers must track the current source of truth.",
      "Over-automation without a human in the loop on payment decisions.",
    ]],
  ];
  cols.forEach(([h5, c, rows], i) => {
    const x = M + i * (colW + 0.5);
    card(s, x, 2.05, colW, 2.55);
    s.addText(h5, { x: x + 0.3, y: 2.28, w: colW - 0.6, h: 0.35, fontFace: F_MONO, fontSize: 11.5, bold: true, color: c, charSpacing: 1.5 });
    rows.forEach((r, j) => {
      s.addShape(RECT, { x: x + 0.32, y: 2.82 + j * 0.62 + 0.06, w: 0.1, h: 0.1, fill: { color: c } });
      s.addText(r, { x: x + 0.56, y: 2.78 + j * 0.62, w: colW - 0.85, h: 0.6, fontFace: F_BODY, fontSize: 12.5, color: MUTED, lineSpacing: 16 });
    });
  });
  card(s, M, 4.85, CW, 1.35, BG2);
  s.addShape(RECT, { x: M, y: 4.85, w: 0.09, h: 1.35, fill: { color: VIOLET } });
  s.addText("RECOMMENDATION", { x: M + 0.35, y: 5.05, w: CW - 0.6, h: 0.3, fontFace: F_MONO, fontSize: 11, bold: true, color: VIOLET, charSpacing: 1.5 });
  s.addText(
    "Pilot a retrieval-grounded, human-in-the-loop policy assistant on one bounded coding domain. Measure analyst time-to-answer and citation accuracy before widening scope.",
    { x: M + 0.35, y: 5.4, w: CW - 0.7, h: 0.7, fontFace: F_BODY, fontSize: 14, color: INK, lineSpacing: 19 });
}

// ============================================================ 14 · HONESTY & ROADMAP
{
  const s = pptx.addSlide();
  base(s, "HONESTY & ROADMAP", "Clear about today’s limits, deliberate about what’s next.", 14);
  const colW = (CW - 0.5) / 2;
  const now = [
    "Sample claims (CLM-2041/2042) are synthetic — no real patient data.",
    "The corpus is a summarized excerpt, but every file cites its real CMS source.",
    "Within-policy reasoning works; reasoning across separate documents still benefits from reranking or agentic retrieval.",
  ];
  const next = [
    "Bigger corpus + a labeled eval benchmark for retrieval precision.",
    "A cross-encoder reranker for multi-document questions.",
    "Human-in-the-loop review before any adjudication reaches a rules engine.",
    "Role-based access and full audit logging on every answer.",
  ];
  [["BEING HONEST — NOW", MAGENTA, now], ["WHERE THIS GOES NEXT", VIOLET, next]].forEach(([h5, c, rows], i) => {
    const x = M + i * (colW + 0.5);
    s.addText(h5, { x, y: 2.05, w: colW, h: 0.35, fontFace: F_MONO, fontSize: 11.5, bold: true, color: c, charSpacing: 1.5 });
    rows.forEach((r, j) => {
      s.addShape(RECT, { x, y: 2.62 + j * 0.92 + 0.06, w: 0.1, h: 0.1, fill: { color: c } });
      s.addText(r, { x: x + 0.26, y: 2.55 + j * 0.92, w: colW - 0.3, h: 0.85, fontFace: F_BODY, fontSize: 13, color: MUTED, lineSpacing: 17 });
    });
  });
}

// ============================================================ 15 · THANK YOU
{
  const s = pptx.addSlide(); s.background = { color: BG };
  s.addShape(RECT, { x: M, y: 2.5, w: 0.16, h: 0.16, fill: { color: VIOLET } });
  s.addText("THANK YOU", { x: M + 0.3, y: 2.43, w: 10, h: 0.3, fontFace: F_MONO, fontSize: 12, color: VIOLET, bold: true, charSpacing: 2 });
  s.addText("Clinical Policy RAG", { x: M, y: 2.95, w: 12, h: 1.0, fontFace: F_HEAD, fontSize: 48, bold: true, color: INK });
  s.addText("Cited answers, claim adjudication, and a working guardrail — built local and free.",
    { x: M, y: 4.05, w: 11.5, h: 0.5, fontFace: F_BODY, fontSize: 17, color: MUTED });
  s.addShape(LN, { x: M, y: 4.95, w: 4, h: 0, line: { color: LINE, width: 1 } });
  s.addText([
    { text: "github.com/Iyman-Ahmed/clinical-rag-poc\n", options: { color: INK, bold: true } },
    { text: "iyman12393@gmail.com\n", options: { color: MUTED } },
    { text: "Iyman Ahmed  ·  Cotiviti — GenAI Research Engineer Intern Assessment", options: { color: DIM } },
  ], { x: M, y: 5.15, w: 12, h: 1.2, fontFace: F_MONO, fontSize: 12.5, lineSpacing: 24 });
}

await pptx.writeFile({ fileName: OUT });
console.log("WROTE", OUT);
