import { products } from "../src/products.js";

// Settings come from environment variables so you can swap providers easily.
// Defaults use Groq (OpenAI-compatible API).
const BASE_URL = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
const MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = (req.body?.query || "").trim();
  if (!query) return res.status(400).json({ error: "Please enter your preferences." });
  if (query.length > 300) return res.status(400).json({ error: "Query too long." });

  const systemPrompt = `You are a product recommendation assistant.
You may ONLY recommend products from the catalog below. Respect budgets and categories in the user's request.
Reply with JSON only, in this exact shape:
{"ids": [<product ids>], "reason": "<one or two friendly sentences>"}
If nothing matches, return {"ids": [], "reason": "<explain why>"}.

Catalog:
${JSON.stringify(products)}`;

  try {
    const aiResponse = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("AI API error:", detail);
      return res.status(502).json({ error: "AI service failed. Try again." });
    }

    const data = await aiResponse.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    // Safety: keep only IDs that really exist in our catalog
    const validIds = new Set(products.map((p) => p.id));
    const ids = (parsed.ids || []).map(Number).filter((id) => validIds.has(id));

    return res.status(200).json({ ids, reason: parsed.reason || "" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
}