// Builds the 2-page Word report + bibliography for the Cotiviti assessment.
// Run:  node build_report.js   ->  Intern_Report_Iyman_Ahmed.docx
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  LevelFormat, ExternalHyperlink, PageBreak,
} = require("docx");

const P = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 120, line: 276 }, children: [new TextRun({ text, ...opts })], ...opts.p });

const H1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true })] });

const bodyRuns = (runs) => new Paragraph({ spacing: { after: 120, line: 276 }, children: runs });

const ref = (runs) =>
  new Paragraph({ spacing: { after: 100 }, indent: { left: 360, hanging: 360 }, children: runs });

const link = (text, url) =>
  new ExternalHyperlink({ children: [new TextRun({ text, style: "Hyperlink" })], link: url });

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } }, // 11pt
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Calibri", color: "6D28D9" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 0 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 },
      margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    children: [
      // ---- Title block ----
      new Paragraph({ spacing: { after: 40 }, children: [
        new TextRun({ text: "Content Management in Healthcare:", bold: true, size: 30 }) ] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: "Retrieval-Augmented Generation for Billing and Coding Policy", bold: true, size: 26, color: "6D28D9" }) ] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: "Iyman Ahmed  •  Cotiviti Generative AI Research Engineer Intern Assessment — Topic 3", italics: true, size: 20, color: "555555" }) ] }),

      // ---- Defining the concept ----
      H1("Defining the Concept"),
      P("Content management in healthcare refers to how payers and providers create, store, maintain, interpret, and operationalize the large body of written knowledge that governs reimbursement and care: billing and coding policies, clinical practice guidelines, payer–provider contracts, and national and local coverage determinations. Unlike ordinary content, this material is high-stakes, frequently revised, and binding. A single change to a Local Coverage Determination (LCD) or an annual ICD-10-CM update can change whether a claim is paid. Today much of this content lives in siloed PDFs and manuals that are reviewed by hand, which makes it slow to search, hard to compare across versions, and difficult to convert into the structured rules that automated payment systems consume."),

      // ---- Trends ----
      H1("Trends"),
      bodyRuns([
        new TextRun("Three trends are converging. First, large language models (LLMs) now summarize and answer questions over long policy documents with near-human fluency. Second, "),
        new TextRun({ text: "retrieval-augmented generation (RAG)", bold: true }),
        new TextRun(" — pairing an LLM with a vector database of source documents (Lewis et al., 2020) — has become the dominant pattern for grounding answers in authoritative text and attaching citations, which directly reduces hallucination. Third, organizations increasingly treat "),
        new TextRun({ text: "policy-to-rules conversion", bold: true }),
        new TextRun(" as a machine-learning problem: extracting structured features and decision logic from prose so payment systems can apply them consistently. CMS publishing coverage data in machine-readable form through the Medicare Coverage Database accelerates all three."),
      ]),

      // ---- Opportunities and threats ----
      H1("Opportunities and Threats"),
      bodyRuns([
        new TextRun({ text: "Opportunities. ", bold: true }),
        new TextRun("A RAG layer over a payer’s policy library would give coding and payment-integrity analysts instant, cited answers instead of manual document searches, compressing research from minutes to seconds. Automated change-detection between policy versions could flag exactly what tightened or loosened between an LCD’s revisions and estimate the downstream claim impact. Converting written rules into structured deltas (JSON, decision tables) creates reusable assets for adjudication engines and shrinks the lag between a CMS update and its enforcement."),
      ]),
      bodyRuns([
        new TextRun({ text: "Threats. ", bold: true }),
        new TextRun("The same fluency that makes LLMs useful makes them dangerous in a regulated domain: an unconstrained model can fabricate a coverage rule or a code with complete confidence, creating compliance and financial liability. Source freshness is a second risk — an answer grounded in a retired policy is wrong even when well-formed. Finally, governance and auditability are non-negotiable; any system that influences payment must be able to show its sources and reasoning."),
      ]),

      // ---- Strategic options ----
      H1("Strategic Options for Cotiviti"),
      new Paragraph({ numbering: { reference: "opts", level: 0 }, spacing: { after: 100 }, children: [
        new TextRun({ text: "Citation-grounded policy assistant. ", bold: true }),
        new TextRun("Build an internal RAG assistant over Cotiviti’s proprietary policy library combined with public CMS sources, with mandatory source attribution and an abstention guardrail (“answer only from retrieved policy”). This directly serves payment-integrity and risk-adjustment analysts."),
      ]}),
      new Paragraph({ numbering: { reference: "opts", level: 0 }, spacing: { after: 100 }, children: [
        new TextRun({ text: "Policy change-detection as a product. ", bold: true }),
        new TextRun("Emit structured, machine-actionable deltas between policy versions to feed both human reviewers and downstream rules engines — a natural extension of Cotiviti’s content and payment-accuracy franchise."),
      ]}),
      new Paragraph({ numbering: { reference: "opts", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun({ text: "An AI Governance Program. ", bold: true }),
        new TextRun("Anchor both in human-in-the-loop review, evaluation against a labeled benchmark, version and freshness tracking, and full audit trails — turning the accuracy-and-compliance threat into a differentiator."),
      ]}),
      bodyRuns([
        new TextRun({ text: "Recommendation. ", bold: true }),
        new TextRun("Begin with option 1 as a low-cost internal pilot using local models and open vector databases, measured on retrieval precision and analyst time saved, then extend toward option 2."),
      ]),

      // ---- POC ----
      H1("Proof of Concept"),
      P("To demonstrate first principles, I built a fully local, zero-cost RAG system over real CMS-cited billing and coding policy: a vector database (ChromaDB) of embedded policy chunks, a local LLM served by LM Studio, a citation on every answer, and an abstention guardrail that refuses unsupported questions. A second mode — a Policy Change Detector — compares two policy versions (for example, Medicare telehealth CY2024 vs CY2025) and outputs a structured rule-delta with an illustrative claim impact. Together the demo shows summarization, comparison of content changes, and conversion of policy into structured rules: the three capabilities most relevant to Cotiviti’s content-management mission."),

      // ================= Bibliography page =================
      new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Bibliography", bold: true })] }),
      ref([ new TextRun("Centers for Medicare & Medicaid Services. (n.d.). "),
        new TextRun({ text: "Medicare Coverage Database (MCD)", italics: true }), new TextRun(". "),
        link("https://www.cms.gov/medicare-coverage-database/", "https://www.cms.gov/medicare-coverage-database/") ]),
      ref([ new TextRun("Centers for Medicare & Medicaid Services. "),
        new TextRun({ text: "Local Coverage Determination: Lumbar MRI (L34220)", italics: true }), new TextRun(". "),
        link("https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=34220", "https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=34220") ]),
      ref([ new TextRun("Centers for Medicare & Medicaid Services. "),
        new TextRun({ text: "Telehealth & Remote Monitoring (MLN901705)", italics: true }), new TextRun(". "),
        link("https://www.cms.gov/files/document/mln901705-telehealth-remote-monitoring.pdf", "https://www.cms.gov/files/document/mln901705-telehealth-remote-monitoring.pdf") ]),
      ref([ new TextRun("Centers for Medicare & Medicaid Services. "),
        new TextRun({ text: "ICD-10-CM code set and official guidelines", italics: true }), new TextRun(". "),
        link("https://www.cms.gov/medicare/coding-billing/icd-10-codes", "https://www.cms.gov/medicare/coding-billing/icd-10-codes") ]),
      ref([ new TextRun("Cotiviti. (2026). "),
        new TextRun({ text: "Healthcare analytics solutions", italics: true }), new TextRun(". "),
        link("https://www.cotiviti.com/solutions", "https://www.cotiviti.com/solutions") ]),
      ref([ new TextRun("Edifecs. (2025). "),
        new TextRun({ text: "Cotiviti completes acquisition of Edifecs", italics: true }), new TextRun(". "),
        link("https://www.edifecs.com/newsroom/2025-cotiviti-completes-acquisition-of-edifecs", "https://www.edifecs.com/newsroom/2025-cotiviti-completes-acquisition-of-edifecs") ]),
      ref([ new TextRun("Gao, Y., et al. (2023). Retrieval-augmented generation for large language models: A survey. "),
        link("https://arxiv.org/abs/2312.10997", "https://arxiv.org/abs/2312.10997") ]),
      ref([ new TextRun("Lewis, P., et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. "),
        new TextRun({ text: "Advances in Neural Information Processing Systems, 33", italics: true }), new TextRun(". "),
        link("https://arxiv.org/abs/2005.11401", "https://arxiv.org/abs/2005.11401") ]),
    ],
  }],
  numbering: { config: [ { reference: "opts", levels: [
    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 460, hanging: 360 } } } } ] } ] },
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Intern_Report_Iyman_Ahmed.docx", buf);
  console.log("wrote Intern_Report_Iyman_Ahmed.docx");
});
