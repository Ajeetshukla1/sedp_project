import { env } from '../config/env.js';
import { type AISummaryContent } from '../validators/ai-summary.validators.js';

export type SummaryContext = {
  conditions: unknown[];
  medications: unknown[];
  allergies: unknown[];
  observations: unknown[];
  trends: unknown[];
  conflicts: unknown[];
};

export type AIProvider = { model: string; generate: (context: SummaryContext) => Promise<unknown> };

const systemPrompt = `You are a clinical information summarizer. Summarize only the supplied patient records. Do not diagnose, prescribe, recommend dosage changes, or make definitive treatment decisions. Return JSON with exactly these arrays: overview, relevantHistory, currentConditions, medications, allergies, recentInvestigations, importantChanges, trends, conflictsMissingInformation, evidence. Every factual item must include sourceIds referring only to supplied source IDs. Clearly state when information is missing.`;

export const openAIProvider: AIProvider = {
  model: env.OPENAI_MODEL ?? 'unconfigured',
  async generate(context) {
    if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) throw new Error('AI_UNAVAILABLE');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(context) },
        ],
      }),
    });
    if (!response.ok) throw new Error('AI_PROVIDER_FAILED');
    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI_PROVIDER_FAILED');
    return JSON.parse(content) as AISummaryContent;
  },
};
