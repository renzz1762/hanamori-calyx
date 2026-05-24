const crypto = require("node:crypto");

// ================================================================
//   HANAMORI CALYX AI — chat.js
//   API  : Olabiba AI (https://www.olabiba.com)
//   Model: built-in (no key needed)
// ================================================================

const BASE = "https://www.olabiba.com";
const UA   = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

// ── Cookie helpers ───────────────────────────────────────────────
function nowUnix() { return Math.floor(Date.now() / 1000); }

function buildInitialCookies() {
  const t = nowUnix();
  const consentUUID = crypto.randomUUID();
  const FCCDCF = encodeURIComponent(JSON.stringify([
    null, null, null, null, null, null,
    [[[32, JSON.stringify([consentUUID, [t, 895000000]])]]],
  ]));
  return {
    olabiba_consent: `true%3A${t + 604800}`,
    FCCDCF,
  };
}

function cookieHeader(cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
}

function saveSetCookie(cookies, headers) {
  const list = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : headers.get("set-cookie") ? [headers.get("set-cookie")] : [];
  for (const raw of list) {
    const first = raw.split(";")[0];
    const idx = first.indexOf("=");
    if (idx !== -1) cookies[first.slice(0, idx)] = first.slice(idx + 1);
  }
}

// ── Generic request dengan cookie jar ───────────────────────────
async function req(cookies, url, options = {}) {
  const hdrs = { "user-agent": UA, "accept-language": "id-ID,id;q=0.9", ...options.headers };
  const c = cookieHeader(cookies);
  if (c) hdrs["cookie"] = c;
  const r = await fetch(url, { ...options, headers: hdrs });
  saveSetCookie(cookies, r.headers);
  return r;
}

// ── Init session (ambil cookies dari homepage) ───────────────────
async function initSession(cookies) {
  await req(cookies, `${BASE}/`, {
    method: "GET",
    headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
  });
}

// ── Kirim pesan ke Olabiba ───────────────────────────────────────
async function sendMessage(cookies, text) {
  const form = new FormData();
  form.set("text",    text);
  form.set("mood",    "friendly");
  form.set("lang",    "id");
  form.set("adblock", "No");
  form.set("theme",   "dark");
  const r = await req(cookies, `${BASE}/php/message.php`, {
    method: "POST",
    body:   form,
    headers: {
      accept:           "*/*",
      origin:           BASE,
      referer:          `${BASE}/`,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    },
  });
  await r.text().catch(() => "");
  return r.status;
}

// ── Decode HTML entities ─────────────────────────────────────────
function decodeHtml(t) {
  return t.replaceAll("&nbsp;"," ").replaceAll("&amp;","&")
          .replaceAll("&lt;","<").replaceAll("&gt;",">")
          .replaceAll("&quot;",'"').replaceAll("&#039;","'").replaceAll("&#39;","'");
}

// ── Bersihkan jawaban dari tag/markup internal Olabiba ───────────
function cleanAnswer(text) {
  let o = text || "";
  const qi = o.indexOf("<!--QUERY:");
  if (qi !== -1) o = o.slice(0, qi);
  const fi = o.search(/\[FOLLOWUP(?::[^\]]*)?\]/i);
  if (fi !== -1) o = o.slice(0, fi);
  return o
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[ELABORATE\]/gi, "")
    .replace(/\[FOLLOWUP(?::[^\]]*)?\][\s\S]*?(?:\[\/FOLLOWUP\])?/gi, "")
    .replace(/\[\/FOLLOWUP\]/gi, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Baca SSE stream jawaban ──────────────────────────────────────
async function readStream(cookies) {
  const r = await req(cookies, `${BASE}/php/stream.php`, {
    method: "GET",
    headers: {
      accept:           "text/event-stream",
      "cache-control":  "no-cache",
      referer:          `${BASE}/`,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    },
  });

  if (!r.body) return { status: r.status, answer: "" };

  const reader  = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", answer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      answer += decodeHtml(data);
    }
  }

  return { status: r.status, answer: cleanAnswer(answer) };
}

// ── Fetch media & save (biar session valid) ──────────────────────
async function postSide(cookies, question, answer) {
  // fetch_media
  await req(cookies, `${BASE}/php/fetch_media.php`, {
    method: "POST",
    headers: { accept:"*/*", origin:BASE, referer:`${BASE}/`, "content-length":"0", "sec-fetch-site":"same-origin","sec-fetch-mode":"cors","sec-fetch-dest":"empty" },
  }).then(r => r.text().catch(()=>"")).catch(()=>{});

  // save-response
  const body = new URLSearchParams({ question, answer, html: answer });
  await req(cookies, `${BASE}/php/save-response.php`, {
    method: "POST", body,
    headers: { accept:"*/*", origin:BASE, referer:`${BASE}/`, "content-type":"application/x-www-form-urlencoded","sec-fetch-site":"same-origin","sec-fetch-mode":"cors","sec-fetch-dest":"empty" },
  }).then(r => r.text().catch(()=>"")).catch(()=>{});
}

// ── Build context prompt dari history ────────────────────────────
function buildPrompt(systemContent, chatMsgs, userPrompt) {
  const lines = [];
  if (systemContent) lines.push(`[System]: ${systemContent}`);
  // Ambil 6 pesan terakhir sebagai konteks
  for (const m of chatMsgs.slice(-6)) {
    if (m.role === "user")      lines.push(`User: ${m.content}`);
    if (m.role === "assistant") lines.push(`Assistant: ${m.content}`);
  }
  lines.push(`User: ${userPrompt}`);
  return lines.join("\n");
}

// ================================================================
//   VERCEL HANDLER
// ================================================================
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: { message: "Method not allowed" } });

  try {
    const { messages = [] } = req.body;

    const systemMsg  = messages.find((m) => m.role === "system");
    const chatMsgs   = messages.filter((m) => m.role !== "system");
    const lastUser   = [...chatMsgs].reverse().find((m) => m.role === "user");

    const userPrompt = lastUser
      ? (typeof lastUser.content === "string"
          ? lastUser.content
          : lastUser.content?.find?.((x) => x.type === "text")?.text ?? "")
      : "";

    if (!userPrompt)
      return res.status(400).json({ error: { message: "No user message" } });

    const sysContent = systemMsg
      ? (typeof systemMsg.content === "string" ? systemMsg.content : JSON.stringify(systemMsg.content))
      : "";

    const prevMsgs = chatMsgs.slice(0, -1).map(m => ({
      role:    m.role,
      content: typeof m.content === "string" ? m.content : (m.content?.find?.(x=>x.type==="text")?.text ?? ""),
    }));

    const finalPrompt = buildPrompt(sysContent, prevMsgs, userPrompt);

    // Init fresh cookie jar per request (Vercel stateless)
    const cookies = buildInitialCookies();

    await initSession(cookies);
    console.log(`[Olabiba] sending prompt len=${finalPrompt.length}`);

    const msgStatus = await sendMessage(cookies, finalPrompt);
    console.log(`[Olabiba] message.php status=${msgStatus}`);

    const { status: streamStatus, answer } = await readStream(cookies);
    console.log(`[Olabiba] stream status=${streamStatus} answer len=${answer.length}`);

    if (answer) {
      postSide(cookies, userPrompt, answer); // async, ga ditunggu
    }

    return res.status(200).json({
      choices: [{
        message: {
          role:    "assistant",
          content: answer || "_(Tidak ada respons, coba lagi bro!)_",
        },
      }],
      _meta: { source: "olabiba" },
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: { message: "Server error: " + err.message } });
  }
};
