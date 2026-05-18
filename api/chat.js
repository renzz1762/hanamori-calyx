const crypto = require("node:crypto");

const API = "https://app.unlimitedai.chat/api/chat";

function parseSetCookie(headers) {
  const result = {};
  const setCookie =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];

  for (const item of setCookie) {
    const first = item.split(";")[0];
    const index = first.indexOf("=");
    if (index !== -1) {
      const key = first.slice(0, index).trim();
      const value = first.slice(index + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

function buildCookie(deviceId, chatId, extraCookies = {}) {
  const cookies = {
    NEXT_LOCALE: "id",
    u_device_id: deviceId,
    home_chat_id: chatId,
    ...extraCookies,
  };
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

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

    const chatId = crypto.randomUUID();
    const deviceId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Ambil system prompt (jika ada) dan gabungkan ke pesan pertama user
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    // Format pesan untuk Unlimited AI
    const formattedMessages = chatMessages.map((m) => {
      const id = crypto.randomUUID();
      const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      return {
        id,
        role: m.role,
        content,
        parts: [{ type: "text", text: content }],
        createdAt,
      };
    });

    // Tambah assistant placeholder di akhir (dibutuhkan Unlimited AI)
    const assistantId = crypto.randomUUID();
    formattedMessages.push({
      id: assistantId,
      role: "assistant",
      content: "",
      parts: [{ type: "text", text: "" }],
      createdAt,
    });

    const body = {
      chatId,
      messages: formattedMessages,
      selectedChatModel: "chat-model-reasoning",
      selectedCharacter: null,
      selectedStory: null,
      deviceId,
      locale: "id",
    };

    const headers = {
      "sec-ch-ua-platform": `"Android"`,
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "content-type": "application/json",
      "sec-ch-ua-mobile": "?1",
      "x-next-intl-locale": "id",
      accept: "*/*",
      origin: "https://app.unlimitedai.chat",
      referer: "https://app.unlimitedai.chat/id",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      cookie: buildCookie(deviceId, chatId),
      priority: "u=1, i",
    };

    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: { message: `Unlimited AI error ${response.status}: ${text}` },
      });
    }

    // Baca stream — format: tiap baris JSON dengan { type: "delta", delta: "..." }
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
        if (!line) continue;
        try {
          const json = JSON.parse(line);
          if (json.type === "delta" && typeof json.delta === "string") {
            answer += json.delta;
          }
        } catch {}
      }
    }

    // Return format OpenAI-compatible
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
};
