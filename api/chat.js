const crypto = require("node:crypto");

// ================================================================
//   HANAMORI CALYX AI — chat.js
//   API  : NoteGPT (https://notegpt.io)
//   Model: gemini-3.1-flash-lite-preview
// ================================================================

const BASE  = "https://notegpt.io";
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
  const raw  = `${now}|13|${randomNumber(9)}`;
  return Buffer.from(raw).toString("base64");
}

function makeCookieHeader() {
  const now             = Math.floor(Date.now() / 1000);
  const anonymousUserId = crypto.randomUUID();
  return [
    `sbox-guid=${encodeURIComponent(makeSboxGuid())}`,
    `anonymous_user_id=${anonymousUserId}`,
    `_gid=GA1.2.${randomNumber(9)}.${now}`,
    `_ga=GA1.2.${randomNumber(9)}.${now}`,
    `_ga_PFX3BRW5RQ=GS2.1.s${now}$o1$g1$t${now}$j20$l0$h${randomNumber(10)}`,
  ].join("; ");
}

// ── Build history messages ────────────────────────────────────────
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
  return pairs.slice(-5).flatMap((p) => [
    { role: "user",      content: p.user },
    { role: "assistant", content: p.assistant },
  ]);
}

// ── Parse SSE ────────────────────────────────────────────────────
function parseSSE(rawBody) {
  let result = "";
  for (const line of rawBody.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean.startsWith("data:")) continue;
    const raw = clean.replace(/^data:\s*/, "").trim();
    if (!raw || raw === "[DONE]") continue;
    try {
      const json = JSON.parse(raw);
      if (typeof json.text === "string") result += json.text;
      if (json.done) break;
    } catch (_) {}
  }
  return result;
}

// ── Collect stream via Node.js readable (robust untuk Vercel) ────
async function readStream(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  }
  return chunks.join("");
}

// ── Panggil NoteGPT ──────────────────────────────────────────────
async function callNoteGPT(prompt, historyMessages) {
  const conversationId = crypto.randomUUID();
  const cookieHeader   = makeCookieHeader();

  const payload = {
    message:          prompt,
    language:         "auto",
    model:            MODEL,
    tone:             "default",
    length:           "moderate",
    conversation_id:  conversationId,
    image_urls:       [],
    history_messages: historyMessages,
    chat_mode:        "standard",
  };

  const response = await fetch(`${BASE}/api/v2/chat/stream`, {
    method: "POST",
    headers: {
      "sec-ch-ua-platform": `"Android"`,
      "User-Agent":          USER_AGENT,
      "sec-ch-ua":           `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "Content-Type":        "application/json",
      "sec-ch-ua-mobile":    "?1",
      Accept:                "text/event-stream, */*",
      Origin:                BASE,
      "sec-fetch-site":      "same-origin",
      "sec-fetch-mode":      "cors",
      "sec-fetch-dest":      "empty",
      Referer:               `${BASE}/ai-chat`,
      "Accept-Language":     "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Cookie:                cookieHeader,
      priority:              "u=1, i",
    },
    body: JSON.stringify(payload),
  });

  // Log status untuk debug di Vercel logs
  console.log(`[NoteGPT] status=${response.status} content-type=${response.headers.get("content-type")}`);

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`[NoteGPT] error body: ${errText.slice(0, 300)}`);
    throw new Error(`NoteGPT error ${response.status}`);
  }

  // Coba baca via body stream, fallback ke .text()
  let rawBody = "";
  try {
    if (response.body && typeof response.body[Symbol.asyncIterator] === "function") {
      rawBody = await readStream(response.body);
    } else {
      rawBody = await response.text();
    }
  } catch (e) {
    console.error("[NoteGPT] stream read error:", e.message);
    rawBody = await response.text().catch(() => "");
  }

  console.log(`[NoteGPT] rawBody length=${rawBody.length}, preview=${rawBody.slice(0, 200)}`);

  const answer = parseSSE(rawBody);
  console.log(`[NoteGPT] parsed answer length=${answer.length}`);

  return { answer, conversationId };
}

// ================================================================
//   VERCEL HANDLER
// ================================================================
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { messages = [] } = req.body;

    const systemMsg = messages.find((m) => m.role === "system");
    const chatMsgs  = messages.filter((m) => m.role !== "system");

    // Prompt terakhir user
    const lastUserMsg = [...chatMsgs].reverse().find((m) => m.role === "user");
    const userPrompt  = lastUserMsg
      ? (typeof lastUserMsg.content === "string"
          ? lastUserMsg.content
          : lastUserMsg.content?.find?.((x) => x.type === "text")?.text || "")
      : "";

    if (!userPrompt) {
      return res.status(400).json({ error: { message: "No user message found" } });
    }

    // History (semua kecuali pesan user terakhir)
    const historyRaw      = chatMsgs.slice(0, -1);
    const historyMessages = [];

    if (systemMsg) {
      const sysContent = typeof systemMsg.content === "string"
        ? systemMsg.content
        : JSON.stringify(systemMsg.content);
      historyMessages.push({ role: "user",      content: sysContent });
      historyMessages.push({ role: "assistant", content: "Siap, aku mengerti." });
    }
    historyMessages.push(...buildHistoryMessages(historyRaw));

    const { answer, conversationId } = await callNoteGPT(userPrompt, historyMessages);

    // Kalau NoteGPT return kosong, coba fallback message
    const finalAnswer = answer.trim() || "_(Tidak ada respons dari server, coba lagi bro!)_";

    return res.status(200).json({
      choices: [{
        message: {
          role:    "assistant",
          content: finalAnswer,
        },
      }],
      _meta: { model: MODEL, conversation_id: conversationId },
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({
      error: { message: "Server error: " + err.message },
    });
  }
};
