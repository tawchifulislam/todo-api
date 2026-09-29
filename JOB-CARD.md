# Job card

What it does (one sentence): Extracts named fields from a pasted receipt or invoice text into structured JSON.
Input: { "text": "string, 1-3000 characters" }
Output: {
  "vendor": "string or null",
  "date": "string (YYYY-MM-DD) or null",
  "total_amount": "number or null",
  "currency": "string (3-letter code) or null",
  "confidence": "0.0-1.0",
  "needs_review": "boolean"
}
It must never: invent a value it did not find in the text, guess a total when the text has no number, perform currency conversion, give financial advice
When unsure it should: set the field to null and needs_review to true, not fabricate a plausible-looking value
