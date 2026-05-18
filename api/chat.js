/* ================================================================
   ╔══════════════════════════════════════════════════════════╗
   ║     HANAMORI CALYX AI — Vercel API Proxy                ║
   ║     By renzzzzofc18 | v5.3                              ║
   ║     Base: https://overchat.ai                           ║
   ╚══════════════════════════════════════════════════════════╝
================================================================ */

import crypto from "node:crypto";

const OVERCHAT_API = "https://api.overchat.ai/v1/chat/completions";

// chatId & deviceId — hardcode biar stabil (public API, aman)
const DEVICE_UUID = "d4af2528-6c44-40d7-853c-81a1f719d686";
const CHAT_ID = "hanamori-calyx-" + "a1b2c3d4e5f6"; // statis biar sesi konsisten

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const body = req.body;
    const messages = body.messages || [];
    const temperature = body.temperature ?? 0.5;

    // Format messages — overchat pakai id di setiap message
    const formattedMessages = messages.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));

    const overBody = {
      chatId: CHAT_ID,
      model: "claude-haiku-4-5-20251001",
      messages: formattedMessages,
      personaId: "claude-haiku-4-5-landing",
      frequency_penalty: 0,
      max_tokens: 4000,
      presence_penalty: 0,
      stream: true, // pakai streaming seperti referensi
      temperature,
      top_p: 0.95,
    };

    const headers = {
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

    const response = await fetch(OVERCHAT_API, {
      method: "POST",
      headers,
      body: JSON.stringify(overBody),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: { message: `Overchat error ${response.status}: ${text}` },
      });
    }

    // Baca SSE stream — persis logika dari referensi
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
          const content = json.choices?.[0]?.delta?.content;
          if (typeof content === "string") {
            answer += content;
          }
        } catch {
          // skip malformed chunk
        }
      }
    }

    // Return dalam format OpenAI-compatible yang dipakai main.js
    return res.status(200).json({
      choices: [
        {
          message: {
            role: "assistant",
            content: answer || "_(Tidak ada respons)_",
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
}
