// Cloudflare Worker for the portfolio.
// Static files are served by the assets binding; only /api/* runs this code.
//
//   POST /api/login   {password}        -> sets a session cookie
//   POST /api/logout
//   GET  /api/me                        -> {admin: bool}
//   GET  /api/edits?page=/path          -> public text overrides for a page
//   PUT  /api/edits   {page, edits}     -> admin: save overrides (edits:null resets the page)
//   GET  /api/notes                     -> admin only: private class/notes index
//   PUT  /api/notes   {classes:[...]}   -> admin only
//
// Needs: secret ADMIN_PASSWORD, KV namespace binding DATA.

const COOKIE = "vn_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const MAX_ATTEMPTS = 8;
const enc = new TextEncoder();

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function passwordMatches(input, secret) {
  // Compare HMACs so length and timing leak nothing about the password.
  const [a, b] = await Promise.all([hmac("pw-check", String(input)), hmac("pw-check", secret)]);
  return safeEqual(a, b);
}

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

async function isAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const token = getCookie(request, COOKIE);
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(env.ADMIN_PASSWORD, "session:" + exp));
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function readJson(request, maxBytes) {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("too large");
  return JSON.parse(text);
}

const validPage = (p) => typeof p === "string" && /^\/[\w\-./]{0,200}$/.test(p) && !p.includes("..");

async function login(request, env) {
  if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD is not set in Cloudflare yet." }, 503);
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rlKey = "rl:" + ip;
  const attempts = Number((await env.DATA.get(rlKey)) || 0);
  if (attempts >= MAX_ATTEMPTS) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);

  let body;
  try { body = await readJson(request, 2000); } catch { return json({ error: "Bad request" }, 400); }

  if (!(await passwordMatches(body.password ?? "", env.ADMIN_PASSWORD))) {
    await env.DATA.put(rlKey, String(attempts + 1), { expirationTtl: 900 });
    return json({ error: "Wrong password" }, 401);
  }
  await env.DATA.delete(rlKey);
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = exp + "." + (await hmac(env.ADMIN_PASSWORD, "session:" + exp));
  return json({ ok: true }, 200, {
    "set-cookie": `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`,
  });
}

async function getEdits(url, env) {
  const page = url.searchParams.get("page");
  if (!validPage(page)) return json({ error: "Bad page" }, 400);
  const data = (await env.DATA.get("edits:" + page, "json")) || {};
  return json(data, 200, { "cache-control": "no-cache" });
}

async function putEdits(request, env) {
  let body;
  try { body = await readJson(request, 400000); } catch { return json({ error: "Bad request" }, 400); }
  if (!validPage(body.page)) return json({ error: "Bad page" }, 400);
  const key = "edits:" + body.page;

  if (body.edits === null) {
    await env.DATA.delete(key);
    return json({ ok: true });
  }
  if (typeof body.edits !== "object" || Array.isArray(body.edits)) return json({ error: "Bad edits" }, 400);

  const current = (await env.DATA.get(key, "json")) || {};
  for (const [idx, val] of Object.entries(body.edits)) {
    if (!/^\d{1,4}$/.test(idx)) continue;
    if (val === null) { delete current[idx]; continue; }
    if (typeof val.h !== "string" || typeof val.o !== "string" || val.h.length > 20000) continue;
    current[idx] = { o: val.o.slice(0, 40), h: val.h };
  }
  await env.DATA.put(key, JSON.stringify(current));
  return json({ ok: true });
}

async function getNotes(env) {
  return json((await env.DATA.get("notes", "json")) || { classes: [] });
}

async function putNotes(request, env) {
  let body;
  try { body = await readJson(request, 400000); } catch { return json({ error: "Bad request" }, 400); }
  if (!body || !Array.isArray(body.classes) || body.classes.length > 200) return json({ error: "Bad notes" }, 400);
  const classes = body.classes.map((c) => ({
    id: String(c.id || "").slice(0, 40),
    code: String(c.code || "").slice(0, 30),
    name: String(c.name || "").slice(0, 120),
    items: (Array.isArray(c.items) ? c.items : []).slice(0, 500).map((it) => ({
      id: String(it.id || "").slice(0, 40),
      title: String(it.title || "").slice(0, 160),
      url: /^https?:\/\//i.test(it.url) ? String(it.url).slice(0, 2000) : "",
      kind: ["lecture", "notes", "pset", "other"].includes(it.kind) ? it.kind : "other",
    })),
  }));
  await env.DATA.put("notes", JSON.stringify({ classes }));
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    try {
      const route = url.pathname;
      const method = request.method;

      if (route === "/api/edits" && method === "GET") return getEdits(url, env);
      if (route === "/api/me" && method === "GET") return json({ admin: await isAdmin(request, env) });

      // Everything below changes state or reads private data.
      if (method !== "GET" && !sameOrigin(request)) return json({ error: "Forbidden" }, 403);

      if (route === "/api/login" && method === "POST") return login(request, env);
      if (route === "/api/logout" && method === "POST") {
        return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` });
      }

      if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);

      if (route === "/api/edits" && method === "PUT") return putEdits(request, env);
      if (route === "/api/notes" && method === "GET") return getNotes(env);
      if (route === "/api/notes" && method === "PUT") return putNotes(request, env);

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: "Server error" }, 500);
    }
  },
};
