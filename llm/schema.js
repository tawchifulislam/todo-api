const { z } = require('zod');

const ExtractOutputSchema = z.object({
  vendor: z.string().nullable(),
  date: z.string().nullable(),
  total_amount: z.number().nullable(),
  currency: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  needs_review: z.boolean(),
});

module.exports = { ExtractOutputSchema };
