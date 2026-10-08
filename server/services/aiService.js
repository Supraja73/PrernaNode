// Real LLM integration with provider abstraction — Anthropic, Gemini, or OpenAI,
// selected purely via environment variables. This is intentionally NOT a mock/hardcoded
// response generator: every call hits a live model. If no key is configured for the
// selected provider, every AI endpoint fails loudly with a clear 503 rather than
// returning fabricated text.
//
// Switching providers requires ONLY changing env vars — no code here or in
// controllers/aiController.js changes:
//   AI_PROVIDER=anthropic|gemini|openai   (default: anthropic)
//   AI_API_KEY=...                        (generic — works for whichever provider is selected)
//   AI_MODEL=...                          (generic — overrides the provider's default model)
//
// Backward compatible with the pre-multi-provider setup (Part 4/5): if AI_PROVIDER is
// unset and ANTHROPIC_API_KEY / ANTHROPIC_MODEL are present, those still work exactly
// as before. Provider-specific legacy names (ANTHROPIC_API_KEY, GEMINI_API_KEY,
// OPENAI_API_KEY / ANTHROPIC_MODEL, GEMINI_MODEL, OPENAI_MODEL) are checked before AI_API_KEY
// / AI_MODEL so nothing that currently works stops working.

const PROVIDER = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-6',
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4.1',
};

const LEGACY_KEY_VAR = { anthropic: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY' };
const LEGACY_MODEL_VAR = { anthropic: 'ANTHROPIC_MODEL', gemini: 'GEMINI_MODEL', openai: 'OPENAI_MODEL' };

const getApiKey = () => process.env[LEGACY_KEY_VAR[PROVIDER]] || process.env.AI_API_KEY || '';
const getModel = () => process.env[LEGACY_MODEL_VAR[PROVIDER]] || process.env.AI_MODEL || DEFAULT_MODELS[PROVIDER];

const isConfigured = () => !!getApiKey();

const requireConfigured = () => {
  if (!isConfigured()) {
    const err = new Error(
      `AI features are not configured on this server. Set AI_API_KEY (or ${LEGACY_KEY_VAR[PROVIDER]}) in server/.env ` +
        `to enable them for AI_PROVIDER="${PROVIDER}".`
    );
    err.statusCode = 503;
    throw err;
  }
};

// --- Provider adapters -------------------------------------------------------------
// Each returns { text, model }. Each throws an Error with .statusCode set on failure —
// generateCompletion() below doesn't need to know which provider it's talking to.

const callAnthropic = async (system, userMessage, maxTokens) => {
  const model = getModel();
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userMessage }] }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    const err = new Error(`Anthropic API error (${response.status}): ${errBody.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return { text, model: data.model || model };
};

const callGemini = async (system, userMessage, maxTokens) => {
  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getApiKey()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    const err = new Error(`Gemini API error (${response.status}): ${errBody.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || '')
    .join('\n')
    .trim();

  return { text, model };
};

const callOpenAI = async (system, userMessage, maxTokens) => {
  const model = getModel();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    const err = new Error(`OpenAI API error (${response.status}): ${errBody.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await response.json();
  const text = (data.choices?.[0]?.message?.content || '').trim();

  return { text, model: data.model || model };
};

const ADAPTERS = { anthropic: callAnthropic, gemini: callGemini, openai: callOpenAI };

/**
 * @param {string} system - system prompt establishing the assistant's role/constraints
 * @param {string} userMessage - the actual request, built from real user/profile/story data
 * @param {number} maxTokens
 * @returns {Promise<{text: string, model: string}>}
 */
const generateCompletion = async (system, userMessage, maxTokens = 1000) => {
  requireConfigured();

  const adapter = ADAPTERS[PROVIDER];
  if (!adapter) {
    const err = new Error(`Unknown AI_PROVIDER "${PROVIDER}". Must be one of: anthropic, gemini, openai.`);
    err.statusCode = 500;
    throw err;
  }

  const { text, model } = await adapter(system, userMessage, maxTokens);

  if (!text) {
    const err = new Error(`AI provider (${PROVIDER}) returned an empty response`);
    err.statusCode = 502;
    throw err;
  }

  return { text, model };
};

module.exports = { generateCompletion, isConfigured, MODEL: getModel(), PROVIDER };
