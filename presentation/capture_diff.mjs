import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots");
const BASE = "http://127.0.0.1:8000";

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1000);

await page.getByRole("button", { name: /Change detector/ }).click();
await page.waitForTimeout(500);
await page.selectOption("#v1", "telehealth_coverage_2024.md");
await page.selectOption("#v2", "telehealth_coverage_2025.md");
await page.click("#diffBtn");
await page.waitForFunction(() => {
  const el = document.querySelector("#changes");
  return el && el.querySelectorAll(".change").length > 0;
}, undefined, { timeout: 180000 });
await page.waitForTimeout(1500);
await page.locator("#changes").screenshot({ path: `${OUT}/change_detector.png` });
console.log("saved change_detector.png");

await browser.close();
console.log("DONE");
