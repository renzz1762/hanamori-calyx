const crypto = require("node:crypto");

// ─── OVERCHAT.AI API ───
const API = "https://overchat.ai/api/chat";

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

    // Pisah system prompt dari pesan chat
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    // Ambil pertanyaan terakhir dari user
    const lastUser = [...chatMessages].reverse().find((m) => m.role === "user");
    const question =
      lastUser
        ? typeof lastUser.content === "string"
          ? lastUser.content
          : JSON.stringify(lastUser.content)
        : "";

    // Format history (tanpa pesan terakhir user)
    const history = chatMessages.slice(0, -1).map((m) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));

    const body = {
      chatId,
      deviceId,
      question,
      history,
      model: "claude-haiku-4-5-20251001",
      systemPrompt: systemMsg
        ? typeof systemMsg.content === "string"
          ? systemMsg.content
          : JSON.stringify(systemMsg.content)
        : undefined,
      locale: "id",
    };

    const headers = {
      "content-type": "application/json",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
      accept: "*/*",
      origin: "https://overchat.ai",
      referer: "https://overchat.ai/",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    };

    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: { message: `Overchat AI error ${response.status}: ${text}` },
      });
    }

    const data = await response.json();

    // Overchat mengembalikan field "answer"
    const answer = data.answer || data.content || data.message || data.text || "";

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
