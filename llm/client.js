const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
  timeout: 30000,
});

const PROMPT_VERSION = 'extract-v1';
const systemPrompt = fs.readFileSync(
  path.join(__dirname, '..', 'prompts', `${PROMPT_VERSION}.md`),
  'utf-8',
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callWithRetry(requestFn, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      lastError = err;
      const status = err.status;

      const shouldRetry = status === 429 || (status >= 500 && status < 600);

      if (!shouldRetry || attempt === maxRetries) {
        throw err;
      }

      const backoffMs = Math.pow(2, attempt) * 1000;
      const jitterMs = Math.random() * 500;
      await sleep(backoffMs + jitterMs);
    }
  }

  throw lastError;
}

function logCall(response, callType) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    prompt_version: PROMPT_VERSION,
    call_type: callType,
    model: response.model,
    input_tokens: response.usage?.prompt_tokens ?? null,
    output_tokens: response.usage?.completion_tokens ?? null,
  };

  fs.mkdirSync('logs', { recursive: true });
  fs.appendFileSync('logs/calls.jsonl', JSON.stringify(logEntry) + '\n');
}

async function callExtractModel(userText) {
  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: process.env.LLM_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
    }),
  );

  logCall(response, 'extract');
  return response.choices[0].message.content;
}

async function callRepairModel(userText, badOutput, validationError) {
  const repairMessage = `Your previous answer was rejected for this reason: ${validationError}\n\nYour previous answer was:\n${badOutput}\n\nReturn only corrected JSON matching the schema. No other text.`;

  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: process.env.LLM_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
        { role: 'assistant', content: badOutput },
        { role: 'user', content: repairMessage },
      ],
    }),
  );

  logCall(response, 'repair');
  return response.choices[0].message.content;
}

module.exports = { callExtractModel, callRepairModel, PROMPT_VERSION };
