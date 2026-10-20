// Uso: node run.mjs <app: tracker|backoffice> <url> <mobile|desktop> <out.html> <results.jsonl> <label>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const [app, url, formFactor, outHtml, resultsFile, label] = process.argv.slice(2);
const TOKEN_KEYS = {
  tracker: "brasaland-tracker-access-token",
  backoffice: "brasaland-backoffice-access-token",
};
const origin = new URL(url).origin;

const loginRes = await fetch(`${origin}/backend/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ username: process.env.LH_USER, password: process.env.LH_PASSWORD }),
});
const { access_token: token } = await loginRes.json();
if (!token) throw new Error(`login failed ${loginRes.status}`);

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-profile-"));
const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-first-run", `--user-data-dir=${userDataDir}`],
});
try {
  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
  const page = await browser.newPage();
  // Página estática ligera del mismo origen: solo para sembrar localStorage.
  await page.goto(`${origin}/favicon.ico`);
  await page.evaluate((k, v) => localStorage.setItem(k, v), TOKEN_KEYS[app], token);
  const cdp = await page.createCDPSession();
  await cdp.send("Network.clearBrowserCache");
  await page.goto("about:blank");

  const flags = { port: chrome.port, output: "html", logLevel: "error", disableStorageReset: true };
  const config = formFactor === "desktop" ? desktopConfig : undefined;
  const result = await lighthouse(url, flags, config);
  fs.writeFileSync(outHtml, result.report);
  const lhr = result.lhr;
  const a = lhr.audits;
  const row = {
    label, app, url, formFactor,
    final: lhr.finalDisplayedUrl,
    perf: Math.round(lhr.categories.performance.score * 100),
    a11y: Math.round(lhr.categories.accessibility.score * 100),
    bp: Math.round(lhr.categories["best-practices"].score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
    fcp: a["first-contentful-paint"].numericValue,
    lcp: a["largest-contentful-paint"].numericValue,
    tbt: a["total-blocking-time"].numericValue,
    cls: a["cumulative-layout-shift"].numericValue,
    si: a["speed-index"].numericValue,
    requests: a["network-requests"].details.items.map((i) => i.url.replace(origin, "")).filter((u) => /_rsc|backend/.test(u)),
  };
  fs.appendFileSync(resultsFile, JSON.stringify(row) + "\n");
  console.log(JSON.stringify({ ...row, requests: row.requests.length }));
  await browser.disconnect();
} finally {
  try { await chrome.kill(); } catch {}
}
