import { type AuthContext } from './patient.service.js';
import { getPatientTimeline } from './timeline.service.js';
import { aiSummarySchema, type AISummaryContent } from '../validators/ai-summary.validators.js';
import { type AIProvider, openAIProvider, type SummaryContext } from './ai-provider.service.js';
import * as repository from '../repositories/ai-summary.repository.js';

function buildContext(timeline: Awaited<ReturnType<typeof getPatientTimeline>>): SummaryContext {
  return {
    conditions: timeline.events.filter((event) => event.type === 'condition'),
    medications: timeline.events.filter((event) => event.type === 'medication'),
    allergies: timeline.events.filter((event) => event.type === 'allergy'),
    observations: timeline.events.filter((event) => event.type === 'observation'),
    trends: timeline.trends,
    conflicts: timeline.conflicts,
  };
}

function collectSourceIds(content: AISummaryContent): string[] {
  return [
    ...new Set([
      ...Object.values(content).flatMap((section) =>
        Array.isArray(section)
          ? section.flatMap((item) =>
              'sourceIds' in item ? item.sourceIds : 'sourceId' in item ? [item.sourceId] : [],
            )
          : [],
      ),
    ]),
  ];
}

function validateSourceIds(content: AISummaryContent, availableSourceIds: Set<string>): void {
  if (collectSourceIds(content).some((sourceId) => !availableSourceIds.has(sourceId)))
    throw new Error('INVALID_AI_SOURCES');
}

export async function generateAISummary(
  patientId: string,
  auth: AuthContext,
  provider: AIProvider = openAIProvider,
) {
  const timeline = await getPatientTimeline(patientId);
  const availableSourceIds = new Set(
    timeline.events
      .flatMap((event) => [event.id, ...(event.sourceIds ?? [])])
      .concat(timeline.trends.flatMap((trend) => trend.evidenceIds))
      .concat(timeline.conflicts.flatMap((conflict) => conflict.evidenceIds)),
  );
  const record = await repository.createAISummary({
    patientId,
    generatedBy: auth.userId,
    model: provider.model,
    status: 'processing',
    sourceIds: [...availableSourceIds],
  });
  try {
    const content = aiSummarySchema.parse(await provider.generate(buildContext(timeline)));
    validateSourceIds(content, availableSourceIds);
    record.status = 'completed';
    record.summary = content;
    record.sourceIds = collectSourceIds(content);
    record.generatedAt = new Date();
    await record.save();
    return record;
  } catch (error) {
    record.status = 'failed';
    record.errorCode =
      error instanceof Error && error.message === 'AI_UNAVAILABLE'
        ? 'AI_UNAVAILABLE'
        : 'AI_GENERATION_FAILED';
    await record.save();
    throw new Error(record.errorCode);
  }
}

export const listAISummaries = repository.listAISummaries;
export const getAISummary = repository.findAISummary;
export const getAISummaryById = repository.findAISummaryById;
