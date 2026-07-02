import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots");
const BASE = "http://127.0.0.1:8000";

const cases = [
  { file: "claim_2041_approve.png",
    q: "Based on the coverage policy, is the lumbar MRI (CPT 72148) on claim CLM-2041 medically necessary? Consider the clinical indication, symptom duration, and conservative treatment attempted, and cite the policy." },
  { file: "claim_2042_deny.png",
    q: "As a payment-integrity reviewer, evaluate claim CLM-2042 for the lumbar MRI against the coverage policy. List which requirements are met and not met, then give a final determination. Cite the policy filename." },
];

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 1700 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1000);

for (const c of cases) {
  await page.fill("#q", c.q);
  await page.click("#askBtn");
  await page.waitForFunction(() => {
    const el = document.querySelector("#askResult");
    return el && el.classList.contains("show") && el.textContent.trim().length > 40;
  }, undefined, { timeout: 120000 });
  await page.waitForTimeout(1600);
  // clip = union of the input row and the answer result
  const clip = await page.evaluate(() => {
    const a = document.querySelector("#q").closest("div").getBoundingClientRect();
    const b = document.querySelector("#askResult").getBoundingClientRect();
    const x = Math.min(a.left, b.left) - 8;
    const y = a.top - 8;
    const right = Math.max(a.right, b.right) + 8;
    const bottom = b.bottom + 8;
    return { x: Math.max(0, x), y: Math.max(0, y), width: right - Math.max(0, x), height: bottom - y };
  });
  await page.screenshot({ path: `${OUT}/${c.file}`, clip });
  console.log("saved", c.file);
}

await browser.close();
console.log("DONE");
