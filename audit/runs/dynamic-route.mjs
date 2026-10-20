import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";
const origin = "http://localhost:3001";
const res = await fetch(`${origin}/backend/auth/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ username: process.env.LH_USER, password: process.env.LH_PASSWORD }) });
const token = (await res.json()).access_token;
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
for (const path of ["/candidates/1", "/"]) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const reqs = [];
  page.on("request", (r) => /\/login|candidates/.test(r.url()) && reqs.push(r.url().replace(origin, "")));
  await page.goto(`${origin}/favicon.ico`);
  await page.evaluate((v) => localStorage.setItem("brasaland-tracker-access-token", v), token);
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  console.log(`${path} -> final ${page.url().replace(origin, "")} | login reqs: ${reqs.filter((u) => u.startsWith("/login")).join(", ") || "ninguna"}`);
  await ctx.close();
}
await browser.disconnect();
try { await chrome.kill(); } catch {}
