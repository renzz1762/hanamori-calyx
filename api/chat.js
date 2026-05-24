const crypto = require("node:crypto");

// ================================================================
//   HANAMORI CALYX AI — chat.js
//   API  : Overchat (https://overchat.ai)
//   Model: alibaba/qwen3-next-80b-a3b-instruct
// ================================================================

const API      = "https://api.overchat.ai/v1/chat/completions";
const MODEL    = "alibaba/qwen3-next-80b-a3b-instruct";
const PERSONA  = "qwen-3-landing";
const UA       = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function makeHeaders(deviceId) {
  return {
    "sec-ch-ua-platform": `"Android"`,
    "x-device-uuid":      deviceId,
    "sec-ch-ua":          `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "sec-ch-ua-mobile":   "?1",
    "x-device-language":  "id-ID",
    "x-device-platform":  "web",
    "x-device-version":   "1.0.44",
    "user-agent":         UA,
    accept:               "*/*",
    "content-type":       "application/json",
    origin:               "https://overchat.ai",
    referer:              "https://overchat.ai/",
    "accept-language":    "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    priority:             "u=1, i",
  };
}

async function callOverchat(messages) {
  // Generate fresh chatId & deviceId tiap request — bypass quota per-session
  const chatId   = crypto.randomUUID();
  const deviceId = crypto.randomUUID();

  const body = {
    chatId,
    model:             MODEL,
    messages,
    personaId:         PERSONA,
    frequency_penalty: 0,
    max_tokens:        4000,
    presence_penalty:  0,
    stream:            true,
    temperature:       0.5,
    top_p:             0.95,
  };

  const response = await fetch(API, {
    method:  "POST",
    headers: makeHeaders(deviceId),
    body:    JSON.stringify(body),
  });

  console.log(`[Overchat] status=${response.status}`);

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Overchat ${response.status}: ${err.slice(0, 200)}`);
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", answer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (typeof content === "string") answer += content;
      } catch (_) {}
    }
  }

  console.log(`[Overchat] answer len=${answer.length}`);
  return answer;
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

    // Konversi messages ke format Overchat (tambahin id tiap message)
    const overchatMessages = messages.map((m) => ({
      id:      crypto.randomUUID(),
      role:    m.role,
      content: typeof m.content === "string"
        ? m.content
        : (m.content?.find?.((x) => x.type === "text")?.text ?? ""),
    }));

    if (!overchatMessages.length)
      return res.status(400).json({ error: { message: "No messages" } });

    const answer = await callOverchat(overchatMessages);

    return res.status(200).json({
      choices: [{
        message: {
          role:    "assistant",
          content: answer.trim() || "_(Tidak ada respons, coba lagi bro!)_",
        },
      }],
      _meta: { model: MODEL },
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: { message: "Server error: " + err.message } });
  }
};
