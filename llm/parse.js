function extractJson(rawText) {
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : rawText;

  try {
    return JSON.parse(candidate.trim());
  } catch (err) {
    return null;
  }
}

module.exports = { extractJson };
