import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots");
const BASE = "http://127.0.0.1:8000";

const q = "A patient has had low back pain for 2 weeks with no neurological deficits and has not tried physical therapy. Is a lumbar MRI (CPT 72148) medically necessary under the coverage policy?";

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 1700 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1000);

await page.fill("#q", q);
await page.click("#askBtn");
await page.waitForFunction(() => {
  const el = document.querySelector("#askResult");
  return el && el.classList.contains("show") && el.textContent.trim().length > 40;
}, undefined, { timeout: 180000 });
await page.waitForTimeout(1600);

const clip = await page.evaluate(() => {
  const a = document.querySelector("#q").closest("div").getBoundingClientRect();
  const b = document.querySelector("#askResult").getBoundingClientRect();
  const x = Math.min(a.left, b.left) - 8;
  const y = a.top - 8;
  const right = Math.max(a.right, b.right) + 8;
  const bottom = b.bottom + 8;
  return { x: Math.max(0, x), y: Math.max(0, y), width: right - Math.max(0, x), height: bottom - y };
});
await page.screenshot({ path: `${OUT}/scenario_2week_reasoned.png`, clip });
console.log("saved scenario_2week_reasoned.png");

await browser.close();
console.log("DONE");
