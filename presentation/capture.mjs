import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots");
const BASE = "http://127.0.0.1:8000";

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 2 });

async function ask(query) {
  await page.fill("#q", query);
  await page.click("#askBtn");
  await page.waitForFunction(() => {
    const el = document.querySelector("#askResult");
    return el && el.classList.contains("show") && el.textContent.trim().length > 30;
  }, { timeout: 120000 });
  await page.waitForTimeout(1500); // let fade-in settle
}

await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1200);

// 1) Grounded cited answer — MRI
await ask("What are the coverage requirements for an MRI of the lumbar spine?");
await page.locator("#askResult").screenshot({ path: `${OUT}/answer_mri.png` });
console.log("saved answer_mri.png");

// 2) Guardrail refusal — capital of France
await ask("What is the capital of France?");
await page.locator("#askResult").screenshot({ path: `${OUT}/guardrail.png` });
console.log("saved guardrail.png");

// 3) ICD-10 lookup
await ask("Which ICD-10 codes apply to type 2 diabetes with chronic kidney disease?");
await page.locator("#askResult").screenshot({ path: `${OUT}/answer_icd10.png` });
console.log("saved answer_icd10.png");

// 4) Change detector — telehealth 2024 vs 2025
await page.getByText("Change detector").click();
await page.waitForTimeout(600);
await page.selectOption("#v1", { label: "telehealth_coverage_2024.md" }).catch(async () => {
  await page.selectOption("#v1", { value: "telehealth_coverage_2024.md" });
});
await page.selectOption("#v2", { label: "telehealth_coverage_2025.md" }).catch(async () => {
  await page.selectOption("#v2", { value: "telehealth_coverage_2025.md" });
});
await page.click("#diffBtn");
await page.waitForFunction(() => {
  const el = document.querySelector("#changes");
  return el && el.textContent.trim().length > 30;
}, { timeout: 120000 });
await page.waitForTimeout(1200);
await page.locator("#changes").screenshot({ path: `${OUT}/change_detector.png` });
console.log("saved change_detector.png");

// 5) Full hero (for title/demo context)
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/hero.png` });
console.log("saved hero.png");

await browser.close();
console.log("DONE");
