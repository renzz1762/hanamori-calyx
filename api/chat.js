const crypto = require("node:crypto");

// ================================================================
//   HANAMORI CALYX AI — chat.js
//   API  : NoteGPT (https://notegpt.io)
//   Model: gemini-3.1-flash-lite-preview
// ================================================================

const BASE = "https://notegpt.io";
const MODEL = "gemini-3.1-flash-lite-preview";

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

// ── Helpers ──────────────────────────────────────────────────────
function randomNumber(length = 9) {
  let r = "";
  for (let i = 0; i < length; i++) r += Math.floor(Math.random() * 10);
  return r;
}

function makeSboxGuid() {
  const now = Math.floor(Date.now() / 1000);
  const raw = `${now}|13|${randomNumber(9)}`;
  return Buffer.from(raw).toString("base64");
}

function makeCookieHeader() {
  const now = Math.floor(Date.now() / 1000);
  const anonymousUserId = crypto.randomUUID();
  return [
    `sbox-guid=${encodeURIComponent(makeSboxGuid())}`,
    `anonymous_user_id=${anonymousUserId}`,
    `_gid=GA1.2.${randomNumber(9)}.${now}`,
    `_ga=GA1.2.${randomNumber(9)}.${now}`,
    `_ga_PFX3BRW5RQ=GS2.1.s${now}$o1$g1$t${now}$j20$l0$h${randomNumber(10)}`,
  ].join("; ");
}

// ── Konversi messages OpenAI-style → history NoteGPT ─────────────
// NoteGPT pakai array [{user, assistant}], ambil 5 pasang terakhir
function buildHistoryMessages(chatMsgs) {
  const pairs = [];
  let i = 0;
  while (i < chatMsgs.length - 1) {
    if (chatMsgs[i].role === "user" && chatMsgs[i + 1]?.role === "assistant") {
      pairs.push({ user: chatMsgs[i].content, assistant: chatMsgs[i + 1].content });
      i += 2;
    } else {
      i++;
    }
  }
  // Ambil 5 pasang terakhir, format jadi flat messages
  return pairs.slice(-5).flatMap((p) => [
    { role: "user", content: p.user },
    { role: "assistant", content: p.assistant },
  ]);
}

// ── Parse SSE stream jadi teks jawaban ───────────────────────────
function parseSSE(rawBody) {
  let result = "";
  for (const line of rawBody.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean.startsWith("data:")) continue;
    const raw = clean.replace(/^data:\s*/, "").trim();
    if (!raw || raw === "[DONE]") continue;
    try {
      const json = JSON.parse(raw);
      if (json.text) result += json.text;
      if (json.done) break;
    } catch (_) {}
  }
  return result;
}

// ── Fetch SSE stream dari NoteGPT ────────────────────────────────
async function callNoteGPT(prompt, historyMessages) {
  const conversationId = crypto.randomUUID();
  const cookieHeader = makeCookieHeader();

  const payload = {
    message: prompt,
    language: "auto",
    model: MODEL,
    tone: "default",
    length: "moderate",
    conversation_id: conversationId,
    image_urls: [],
    history_messages: historyMessages,
    chat_mode: "standard",
  };

  const response = await fetch(`${BASE}/api/v2/chat/stream`, {
    method: "POST",
    headers: {
      "sec-ch-ua-platform": `"Android"`,
      "User-Agent": USER_AGENT,
      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "Content-Type": "application/json",
      "sec-ch-ua-mobile": "?1",
      Accept: "*/*",
      Origin: BASE,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      Referer: `${BASE}/ai-chat`,
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Cookie: cookieHeader,
      priority: "u=1, i",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`NoteGPT error ${response.status}: ${errText}`);
  }

  // Baca stream sebagai text (Node 18+ / Vercel Edge Runtime support)
  const rawBody = await response.text();
  const answer = parseSSE(rawBody);

  return { answer, conversationId };
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

    // Pisah system prompt & chat messages
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMsgs  = messages.filter((m) => m.role !== "system");

    // Prompt terakhir dari user
    const lastUserMsg = [...chatMsgs].reverse().find((m) => m.role === "user");
    const userPrompt  = lastUserMsg
      ? (typeof lastUserMsg.content === "string"
          ? lastUserMsg.content
          : lastUserMsg.content?.find?.((x) => x.type === "text")?.text || "")
      : "";

    if (!userPrompt) {
      return res.status(400).json({ error: { message: "No user message found" } });
    }

    // Build history (semua pesan kecuali yang terakhir dari user)
    const historyRaw = chatMsgs.slice(0, -1);

    // Sisipkan system prompt sebagai pasangan user/assistant pertama
    const historyMessages = [];
    if (systemMsg) {
      const sysContent = typeof systemMsg.content === "string"
        ? systemMsg.content
        : JSON.stringify(systemMsg.content);
      historyMessages.push({ role: "user", content: sysContent });
      historyMessages.push({ role: "assistant", content: "Siap, aku mengerti." });
    }
    historyMessages.push(...buildHistoryMessages(historyRaw));

    // Panggil NoteGPT
    const { answer, conversationId } = await callNoteGPT(userPrompt, historyMessages);

    return res.status(200).json({
      choices: [
        {
          message: {
            role: "assistant",
            content: answer.trim() || "_(Tidak ada respons)_",
          },
        },
      ],
      // Info tambahan (opsional, untuk debug)
      _meta: {
        model: MODEL,
        conversation_id: conversationId,
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({
      error: { message: "Server error: " + err.message },
    });
  }
};
