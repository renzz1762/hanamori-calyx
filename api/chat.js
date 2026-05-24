const crypto = require("node:crypto");

// ================================================================
//   HANAMORI CALYX AI — chat.js
//   API  : NoteGPT (https://notegpt.io)
//   Model: gemini-3.1-flash-lite-preview
// ================================================================

const BASE  = "https://notegpt.io";
const MODEL = "gemini-3.1-flash-lite-preview";
const UA    = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function randomNumber(length = 9) {
  let r = "";
  for (let i = 0; i < length; i++) r += Math.floor(Math.random() * 10);
  return r;
}

function makeSboxGuid() {
  const now = Math.floor(Date.now() / 1000);
  return Buffer.from(`${now}|13|${randomNumber(9)}`).toString("base64");
}

function makeCookieHeader() {
  const now = Math.floor(Date.now() / 1000);
  return [
    `sbox-guid=${encodeURIComponent(makeSboxGuid())}`,
    `anonymous_user_id=${crypto.randomUUID()}`,
    `_gid=GA1.2.${randomNumber(9)}.${now}`,
    `_ga=GA1.2.${randomNumber(9)}.${now}`,
    `_ga_PFX3BRW5RQ=GS2.1.s${now}$o1$g1$t${now}$j20$l0$h${randomNumber(10)}`,
  ].join("; ");
}

function buildHistoryMessages(chatMsgs) {
  const pairs = [];
  let i = 0;
  while (i < chatMsgs.length - 1) {
    if (chatMsgs[i].role === "user" && chatMsgs[i + 1]?.role === "assistant") {
      pairs.push({ user: chatMsgs[i].content, assistant: chatMsgs[i + 1].content });
      i += 2;
    } else { i++; }
  }
  return pairs.slice(-5).flatMap((p) => [
    { role: "user",      content: p.user },
    { role: "assistant", content: p.assistant },
  ]);
}

// ── Baca SSE stream chunk by chunk (paling reliable di Vercel) ───
async function readSSEStream(responseBody) {
  const reader  = responseBody.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        // Format NoteGPT: { text: "...", done: false }
        if (typeof json.text === "string") answer += json.text;
        // Format OpenAI-style fallback: choices[0].delta.content
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string") answer += delta;
        if (json.done === true) return answer;
      } catch (_) {}
    }
  }

  return answer;
}

async function callNoteGPT(prompt, historyMessages) {
  const conversationId = crypto.randomUUID();

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
    method:  "POST",
    headers: {
      "sec-ch-ua-platform": `"Android"`,
      "User-Agent":          UA,
      "sec-ch-ua":           `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "Content-Type":        "application/json",
      "sec-ch-ua-mobile":    "?1",
      Accept:                "text/event-stream, */*",
      Origin:                BASE,
      "sec-fetch-site":      "same-origin",
      "sec-fetch-mode":      "cors",
      "sec-fetch-dest":      "empty",
      Referer:               `${BASE}/ai-chat`,
      "Accept-Language":     "id-ID,id;q=0.9",
      Cookie:                makeCookieHeader(),
      priority:              "u=1, i",
    },
    body: JSON.stringify(payload),
  });

  console.log(`[NoteGPT] status=${response.status} ct=${response.headers.get("content-type")}`);

  if (!response.ok) {
    const t = await response.text().catch(() => "");
    throw new Error(`NoteGPT ${response.status}: ${t.slice(0, 200)}`);
  }

  let answer = "";

  // Coba stream reader dulu (paling akurat)
  if (response.body?.getReader) {
    answer = await readSSEStream(response.body);
  } else {
    // Fallback: .text() langsung
    const raw = await response.text();
    console.log(`[NoteGPT] fallback text len=${raw.length} preview=${raw.slice(0, 200)}`);
    for (const line of raw.split(/\r?\n/)) {
      const clean = line.trim();
      if (!clean.startsWith("data:")) continue;
      const data = clean.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        if (typeof json.text === "string") answer += json.text;
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string") answer += delta;
      } catch (_) {}
    }
  }

  console.log(`[NoteGPT] answer len=${answer.length}`);
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
  if (req.method !== "POST")
    return res.status(405).json({ error: { message: "Method not allowed" } });

  try {
    const { messages = [] } = req.body;

    const systemMsg = messages.find((m) => m.role === "system");
    const chatMsgs  = messages.filter((m) => m.role !== "system");

    const lastUser   = [...chatMsgs].reverse().find((m) => m.role === "user");
    const userPrompt = lastUser
      ? (typeof lastUser.content === "string"
          ? lastUser.content
          : lastUser.content?.find?.((x) => x.type === "text")?.text ?? "")
      : "";

    if (!userPrompt)
      return res.status(400).json({ error: { message: "No user message" } });

    const historyMessages = [];
    if (systemMsg) {
      const sys = typeof systemMsg.content === "string"
        ? systemMsg.content : JSON.stringify(systemMsg.content);
      historyMessages.push({ role: "user",      content: sys });
      historyMessages.push({ role: "assistant", content: "Siap, aku mengerti." });
    }
    historyMessages.push(...buildHistoryMessages(chatMsgs.slice(0, -1)));

    const { answer, conversationId } = await callNoteGPT(userPrompt, historyMessages);

    return res.status(200).json({
      choices: [{
        message: {
          role:    "assistant",
          content: answer.trim() || "_(Tidak ada respons, coba lagi bro!)_",
        },
      }],
      _meta: { model: MODEL, conversation_id: conversationId },
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: { message: "Server error: " + err.message } });
  }
};
