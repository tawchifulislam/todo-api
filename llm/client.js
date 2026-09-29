const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

const PROMPT_VERSION = 'extract-v1';
const systemPrompt = fs.readFileSync(
  path.join(__dirname, '..', 'prompts', `${PROMPT_VERSION}.md`),
  'utf-8',
);

async function callExtractModel(userText) {
  const response = await client.chat.completions.create({
    model: process.env.LLM_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ],
  });

  return response.choices[0].message.content;
}

module.exports = { callExtractModel, PROMPT_VERSION };
