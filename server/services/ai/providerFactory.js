import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

const tryJsonParse = (value) => {
  if (!value || typeof value !== "string") return null;
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(value.slice(start, end + 1));
  } catch {
    return null;
  }
};

const callOpenAICompatible = async ({ baseURL, apiKey, model, prompt }) => {
  if (!baseURL) return null;

  const response = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only valid JSON for the lyrics cleanup pipeline." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible request failed with ${response.status}`);
  }

  const data = await response.json();
  return tryJsonParse(data?.choices?.[0]?.message?.content || "");
};

const callAnthropicCompatible = async ({ baseURL, apiKey, model, prompt }) => {
  if (!baseURL || !apiKey) return null;

  const response = await fetch(`${baseURL.replace(/\/$/, "")}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model || DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed with ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.map((item) => item?.text || "").join("\n") || "";
  return tryJsonParse(text);
};

const callGemini = async ({ apiKey, model, prompt }) => {
  if (!apiKey) return null;
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: model || DEFAULT_GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });
  const text = typeof response?.text === "function" ? response.text() : (response?.text || "");
  return tryJsonParse(text);
};

export const getAiProviderConfig = () => {
  const provider = (process.env.SONG_AI_PROVIDER || process.env.AI_PROVIDER || "heuristic").toLowerCase();
  return {
    provider,
    model: process.env.SONG_AI_MODEL || process.env.AI_MODEL || "",
    baseUrl: process.env.SONG_AI_BASE_URL || process.env.OPENAI_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.LOCAL_LLM_BASE_URL || "",
    apiKey: process.env.SONG_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.LOCAL_LLM_API_KEY || ""
  };
};

export const listAvailableAiProviders = () => {
  const config = getAiProviderConfig();
  const providers = ["heuristic"];
  if (config.apiKey || config.baseUrl) providers.push(config.provider);
  return providers;
};

export const runProviderPrompt = async (prompt) => {
  const config = getAiProviderConfig();

  try {
    if (config.provider === "gemini") {
      return await callGemini({ apiKey: config.apiKey, model: config.model || DEFAULT_GEMINI_MODEL, prompt });
    }

    if (config.provider === "anthropic") {
      return await callAnthropicCompatible({ baseURL: config.baseUrl || process.env.ANTHROPIC_BASE_URL, apiKey: config.apiKey, model: config.model || DEFAULT_ANTHROPIC_MODEL, prompt });
    }

    if (config.provider === "openai" || config.provider === "openai-compatible" || config.provider === "local") {
      return await callOpenAICompatible({ baseURL: config.baseUrl || process.env.OPENAI_BASE_URL || process.env.LOCAL_LLM_BASE_URL, apiKey: config.apiKey, model: config.model || DEFAULT_MODEL, prompt });
    }

    if (config.provider === "ollama") {
      const baseUrl = config.baseUrl || "http://127.0.0.1:11434/v1";
      return await callOpenAICompatible({ baseURL: baseUrl, apiKey: config.apiKey, model: config.model || "llama3.1", prompt });
    }
  } catch (err) {
    console.warn(`[AI Provider] ${config.provider} failed: ${err.message}`);
  }

  return null;
};
