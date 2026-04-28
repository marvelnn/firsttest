const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const safeMessages = messages
      .filter((message) => message && typeof message.content === "string")
      .slice(-8)
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content
      }));

    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are an expert padel coach. Give concise, practical tips for beginner to intermediate players. Focus on technique, tactics, fitness, and injury prevention."
          },
          ...safeMessages
        ]
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      return res.status(openAIResponse.status).json({ error: errorText || "OpenAI request failed." });
    }

    const data = await openAIResponse.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "No response returned by OpenAI." });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: "Server error while generating reply." });
  }
}
