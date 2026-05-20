const crypto = require("node:crypto");

// ================================================================
//   HANAMORI CALYX AI — chat.js
//   API  : DeepAI (https://deepai.org)
//   Model: standard
// ================================================================

const API = "https://api.deepai.org/hacking_is_a_serious_crime";
const SAVE_SESSION_API = "https://api.deepai.org/save_chat_session";

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

// ── MD5-like hash (sama persis dari gist asli) ───────────────────
function md5Like(input) {
  const a = [];
  for (let b = 0; b < 64; ) {
    a[b] = 0 | (4294967296 * Math.sin(++b % Math.PI));
  }
  let d, e, f;
  let g = [(d = 1732584193), (e = 4023233417), ~d, ~e];
  const h = [];
  let l = unescape(encodeURI(input)) + "\u0080";
  let k = l.length;
  let c = (--k / 4 + 2) | 15;
  h[--c] = 8 * k;
  while (~k) { h[k >> 2] |= l.charCodeAt(k) << (8 * k--); }
  for (let b = 0, l = 0; b < c; b += 16) {
    for (
      k = g;
      l < 64;
      k = [
        (f = k[3]),
        d + (((f = k[0] + [d & e | ~d & f, f & d | ~f & e, d ^ e ^ f, e ^ (d | ~f)][(k = l >> 4)] +
          a[l] + ~~h[b | ([l, 5 * l + 1, 3 * l + 5, 7 * l][k] & 15)]) <<
          (k = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21][4 * k + (l++ % 4)])) | (f >>> -k)),
        d,
        e,
      ]
    ) {
      d = k[1] | 0;
      e = k[2];
    }
    for (l = 4; l; ) { g[--l] += k[l]; }
  }
  let result = "";
  for (let l = 0; l < 32; ) {
    result += ((g[l >> 3] >> (4 * (1 ^ l++))) & 15).toString(16);
  }
  return result.split("").reverse().join("");
}

// ── Generate api-key ─────────────────────────────────────────────
function generateIslandKey() {
  const randomNumber = Math.round(Math.random() * 100000000000).toString();
  const hash = md5Like(
    USER_AGENT +
      md5Like(
        USER_AGENT +
          md5Like(
            USER_AGENT +
              randomNumber +
              "hackers_become_a_little_stinkier_every_time_they_hack"
          )
      )
  );
  return `tryit-${randomNumber}-${hash}`;
}

// ── FormData builder ─────────────────────────────────────────────
function createFormData(fields) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return form;
}

// ── Base headers ─────────────────────────────────────────────────
function baseHeaders(extra = {}) {
  return {
    "sec-ch-ua-platform": `"Android"`,
    "user-agent": USER_AGENT,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "sec-ch-ua-mobile": "?1",
    accept: "*/*",
    origin: "https://deepai.org",
    "sec-fetch-site": "same-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    priority: "u=1, i",
    ...extra,
  };
}

// ── Save session ke DeepAI (opsional, biar history tersimpan) ────
async function saveChatSession(sessionUuid, messages) {
  try {
    const form = createFormData({
      uuid: sessionUuid,
      title: "",
      chat_style: "chat",
      messages: JSON.stringify(messages),
    });
    await fetch(SAVE_SESSION_API, {
      method: "POST",
      headers: baseHeaders(),
      body: form,
    });
  } catch (_) {
    // Abaikan error save session, tidak kritikal
  }
}

// ================================================================
//   VERCEL HANDLER
// ================================================================
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { messages = [] } = req.body;

    // Pisah system prompt & format history
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMsgs = messages.filter((m) => m.role !== "system");

    // Build chat history untuk DeepAI
    const chatHistory = [];

    // System prompt disisipkan sebagai pesan pertama
    if (systemMsg) {
      chatHistory.push({
        role: "user",
        content: typeof systemMsg.content === "string"
          ? systemMsg.content
          : JSON.stringify(systemMsg.content),
      });
      chatHistory.push({ role: "assistant", content: "Siap, aku mengerti." });
    }

    for (const m of chatMsgs) {
      chatHistory.push({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      });
    }

    const sessionUuid = crypto.randomUUID();
    const apiKey = generateIslandKey();

    const form = createFormData({
      chat_style: "chat",
      chatHistory: JSON.stringify(chatHistory),
      model: "standard",
      session_uuid: sessionUuid,
      sensitivity_request_id: crypto.randomUUID(),
      hacker_is_stinky: "very_stinky",
      enabled_tools: JSON.stringify(["image_generator", "image_editor"]),
    });

    const response = await fetch(API, {
      method: "POST",
      headers: baseHeaders({ "api-key": apiKey }),
      body: form,
    });

    const answer = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: { message: `DeepAI error ${response.status}: ${answer}` },
      });
    }

    const trimmedAnswer = answer.trim();

    // Save session async (tidak nunggu)
    saveChatSession(sessionUuid, [
      ...chatHistory,
      { role: "assistant", content: trimmedAnswer },
    ]);

    return res.status(200).json({
      choices: [
        {
          message: {
            role: "assistant",
            content: trimmedAnswer || "_(Tidak ada respons)_",
          },
        },
      ],
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({
      error: { message: "Server error: " + err.message },
    });
  }
};
