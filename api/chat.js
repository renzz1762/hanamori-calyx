/* ================================================================
   ╔══════════════════════════════════════════════════════════╗
   ║     HANAMORI CALYX AI — Vercel API Proxy                ║
   ║     By renzzzzofc18 | v5.5 (Overchat Fixed)             ║
   ╚══════════════════════════════════════════════════════════╝
================================================================ */

import crypto from "node:crypto";

const OVERCHAT_API = "https://api.overchat.ai/v1/chat/completions";
const DEVICE_UUID = "d4af2528-6c44-40d7-853c-81a1f719d686";

// Model + persona yang valid di Overchat (dicoba urutan, fallback ke berikutnya)
const MODEL_LIST = [
  { model: "gpt-4o-mini",               personaId: "gpt-4o-mini-landing" },
  { model: "gpt-4o",                    personaId: "gpt-4o-landing" },
  { model: "claude-3-5-haiku-20241022", personaId: "claude-haiku-landing" },
  { model: "claude-3-haiku-20240307",   personaId: "claude-haiku-landing" },
  { model: "gpt-3.5-turbo",             personaId: "gpt-35-turbo-landing" },
];

function makeHeaders() {
  return {
    "sec-ch-ua-platform": `"Android"`,
    "x-device-uuid": DEVICE_UUID,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "sec-ch-ua-mobile": "?1",
    "x-device-language": "id-ID",
    "x-device-platform": "web",
    "x-device-version": "1.0.44",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://overchat.ai",
    referer: "https://overchat.ai/",
    "accept-language": "id-ID,id;q=0.9",
    priority: "u=1, i",
  };
}

async function tryModel(model, personaId, messages, temperature) {
  // Buat chatId unik per request biar tidak di-block/rate-limit
  const chatId = "hanamori-" + crypto.randomUUID();

  const formattedMessages = messages.map((m) => ({
    id: crypto.randomUUID(),
    role: m.role,
    content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
  }));

  const body = {
    chatId,
    model,
    messages: formattedMessages,
    personaId,
    frequency_penalty: 0,
    max_tokens: 4000,
    presence_penalty: 0,
    stream: true,
    temperature,
    top_p: 0.95,
  };

  const response = await fetch(OVERCHAT_API, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  // Baca SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

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
        // Cek apakah server return error di dalam stream
        if (json.error) {
          throw new Error(JSON.stringify(json.error));
        }
        const content = json.choices?.[0]?.delta?.content;
        if (typeof content === "string") {
          answer += content;
        }
      } catch (e) {
        if (e.message.includes("error")) throw e;
        // skip malformed chunk
      }
    }
  }

  if (!answer) throw new Error("Empty response from model");
  return answer;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const body = req.body;
    const messages = body.messages || [];
    const temperature = body.temperature ?? 0.5;

    let lastError = null;

    // Coba tiap model satu per satu sampai ada yang berhasil
    for (const { model, personaId } of MODEL_LIST) {
      try {
        const answer = await tryModel(model, personaId, messages, temperature);
        return res.status(200).json({
          choices: [{ message: { role: "assistant", content: answer } }],
        });
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed:`, err.message);
        // Lanjut ke model berikutnya
      }
    }

    // Semua model gagal
    return res.status(500).json({
      error: { message: "Semua model gagal. Error terakhir: " + lastError?.message },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({
      error: { message: "Server error: " + err.message },
    });
  }
}
