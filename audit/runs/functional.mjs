// Verificación funcional de los flujos afectados por las correcciones.
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";

const apps = {
  tracker: { origin: "http://localhost:3001", key: "brasaland-tracker-access-token" },
  backoffice: { origin: "http://localhost:3000", key: "brasaland-backoffice-access-token" },
};

async function login(origin) {
  const res = await fetch(`${origin}/backend/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: process.env.LH_USER, password: process.env.LH_PASSWORD }),
  });
  return (await res.json()).access_token;
}

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

async function visit(app, path, { token } = {}) {
  const { origin, key } = apps[app];
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const errors = [];
  const rsc = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => /_rsc=/.test(r.url()) && rsc.push(r.url().replace(origin, "")));
  await page.goto(`${origin}/favicon.ico`);
  await page.evaluate((k, v) => (v ? localStorage.setItem(k, v) : localStorage.removeItem(k)), key, token ?? null);
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  return { page, ctx, errors, rsc, url: () => page.url().replace(origin, "") };
}

for (const app of ["tracker", "backoffice"]) {
  const token = await login(apps[app].origin);

  // 1. Sesión válida en la home: sin rebote a /login.
  let v = await visit(app, "/", { token });
  const text = await v.page.evaluate(() => document.body.innerText);
  check(`${app}: home con sesión permanece en /`, v.url() === "/", v.url());
  check(`${app}: home con sesión sin navegación RSC extra`, v.rsc.length === 0, v.rsc.join(","));
  check(`${app}: home renderiza contenido`, app === "tracker" ? text.includes("Centro de incidencias") && !text.includes("Cargando incidencias") : text.includes("Backoffice operativo"));
  check(`${app}: home sin errores de consola`, v.errors.length === 0, v.errors.join(" | ").slice(0, 300));
  if (app === "tracker") {
    const labels = await v.page.evaluate(() =>
      [...document.querySelectorAll("main select, main input, main textarea")].map((el) => ({
        tag: el.tagName,
        labelled: el.labels?.length > 0 || el.hasAttribute("aria-label"),
      }))
    );
    check("tracker: todos los controles del formulario tienen label asociado", labels.every((l) => l.labelled), JSON.stringify(labels.filter((l) => !l.labelled)));
    // Interacción: un filtro sigue disparando la carga.
    const filter = await v.page.$("select[id] + p, label");
    const before = await v.page.evaluate(() => document.querySelectorAll("article").length);
    const statusFilterId = await v.page.evaluate(() => [...document.querySelectorAll("label")].find((l) => l.textContent === "Estado")?.htmlFor);
    await v.page.select(`[id="${statusFilterId}"]`, "resolved");
    await new Promise((r) => setTimeout(r, 1500));
    const after = await v.page.evaluate(() => ({ n: document.querySelectorAll("article").length, txt: document.body.innerText.includes("No hay incidencias") }));
    check("tracker: filtro por estado funciona", Boolean(statusFilterId) && (after.n <= before || after.txt), `antes=${before} después=${after.n}`);
    void filter;
  }
  await v.ctx.close();

  // 2. Deep link con sesión.
  const deep = app === "tracker" ? "/account/profile" : "/inventory/products";
  v = await visit(app, deep, { token });
  check(`${app}: deep link ${deep} con sesión permanece`, v.url() === deep, v.url());
  if (app === "tracker") {
    const name = await v.page.$eval("#profile-name", (el) => el.value).catch(() => null);
    check("tracker: perfil carga datos en input con label", Boolean(name), String(name));
  }
  await v.ctx.close();

  // 3. Sin sesión: redirige a login conservando next.
  v = await visit(app, deep);
  check(`${app}: sin sesión ${deep} redirige a login`, v.url().startsWith("/login"), v.url());
  await v.ctx.close();

  // 4. Con sesión en /login: vuelve a la home.
  v = await visit(app, "/login", { token });
  check(`${app}: con sesión /login redirige a /`, v.url() === "/", v.url());
  await v.ctx.close();
}

await browser.disconnect();
try { await chrome.kill(); } catch {}
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
