/* ================================================================
   ╔══════════════════════════════════════════════════════════╗
   ║     HANAMORI CALYX AI — Vercel API Proxy                ║
   ║     By renzzzzofc18 | v5.5                              ║
   ║     Base: https://app.unlimitedai.chat/                 ║
   ╚══════════════════════════════════════════════════════════╝
================================================================ */

import crypto from "node:crypto";

const API = "https://app.unlimitedai.chat/api/chat";
const MODEL = "chat-model-reasoning";
const LOCALE = "id";

function nowIso() {
  return new Date().toISOString();
}

function makeMessage(role, content) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    parts: [{ type: "text", text: content }],
    createdAt: nowIso(),
  };
}

function pickTextFromJson(json) {
  if (!json || typeof json !== "object") return "";
  if (typeof json.delta === "string") return json.delta;
  if (typeof json.textDelta === "string") return json.textDelta;
  if (typeof json.text === "string") return json.text;
  if (typeof json.content === "string") return json.content;
  if (typeof json.answer === "string") return json.answer;
  if (typeof json.response === "string") return json.response;
  if (typeof json.message?.content === "string") return json.message.content;
  if (typeof json.choices?.[0]?.delta?.content === "string") return json.choices[0].delta.content;
  if (typeof json.choices?.[0]?.message?.content === "string") return json.choices[0].message.content;
  if (Array.isArray(json)) return json.map(pickTextFromJson).join("");
  return "";
}

function parseStreamText(text) {
  let answer = "";
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line === "[DONE]") continue;
    if (line.startsWith("data:")) {
      line = line.slice(5).trim();
      if (!line || line === "[DONE]") continue;
    }
    if (/^[a-z0-9]+:/i.test(line)) {
      const prefix = line.slice(0, line.indexOf(":"));
      const value = line.slice(line.indexOf(":") + 1).trim();
      if (prefix === "0") {
        try {
          const parsed = JSON.parse(value);
          answer += typeof parsed === "string" ? parsed : pickTextFromJson(parsed);
        } catch {
          answer += value.replace(/^"|"$/g, "");
        }
        continue;
      }
      try { answer += pickTextFromJson(JSON.parse(value)); } catch {}
      continue;
    }
    try { answer += pickTextFromJson(JSON.parse(line)); } catch {}
  }
  return answer.trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed" } });

  try {
    const body = req.body;
    const rawMessages = body.messages || [];

    // Gabungin semua jadi satu prompt dengan history
    const conversationText = rawMessages
      .filter(m => m.role !== "system")
      .map(m => {
        const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        return (m.role === "user" ? "User: " : "Assistant: ") + content;
      })
      .join("\n");

    // System prompt dari messages
    const systemMsg = rawMessages.find(m => m.role === "system");
    const systemText = systemMsg
      ? (typeof systemMsg.content === "string" ? systemMsg.content : JSON.stringify(systemMsg.content))
      : "";

    const finalPrompt = systemText
      ? `${systemText}\n\n${conversationText}\nAssistant:`
      : `${conversationText}\nAssistant:`;

    const chatId = crypto.randomUUID();
    const deviceId = crypto.randomUUID();
    const anonId = crypto.randomUUID();

    const userMessage = makeMessage("user", finalPrompt);
    const assistantMessage = makeMessage("assistant", "");

    const unlimitedBody = {
      chatId,
      messages: [userMessage, assistantMessage],
      selectedChatModel: MODEL,
      selectedCharacter: null,
      selectedStory: null,
      locale: LOCALE,
    };

    const headers = {
      "sec-ch-ua-platform": `"Android"`,
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua": `"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"`,
      "content-type": "application/json",
      "sec-ch-ua-mobile": "?1",
      "x-next-intl-locale": LOCALE,
      accept: "*/*",
      origin: "https://app.unlimitedai.chat",
      referer: "https://app.unlimitedai.chat/id",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      cookie: [
        `NEXT_LOCALE=${LOCALE}`,
        `u_device_id=${deviceId}`,
        `u_anon_id=${anonId}`,
        `home_chat_id=${chatId}`,
      ].join("; "),
    };

    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify(unlimitedBody),
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: { message: `UnlimitedAI error ${response.status}: ${text.slice(0, 300)}` },
      });
    }

    const answer = parseStreamText(text);

    return res.status(200).json({
      choices: [{
        message: {
          role: "assistant",
          content: answer || "_(Tidak ada respons)_",
        },
      }],
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: { message: "Server error: " + err.message } });
  }
}
