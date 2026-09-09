import { http } from './http';

export type CitedStatement = { text: string; sourceIds: string[] };
export type AISummaryContent = {
  overview: CitedStatement[];
  relevantHistory: CitedStatement[];
  currentConditions: CitedStatement[];
  medications: CitedStatement[];
  allergies: CitedStatement[];
  recentInvestigations: CitedStatement[];
  importantChanges: CitedStatement[];
  trends: CitedStatement[];
  conflictsMissingInformation: CitedStatement[];
  evidence: Array<{ sourceId: string; description: string }>;
};
export type AISummary = {
  _id: string;
  status: 'processing' | 'completed' | 'failed';
  model: string;
  summary?: AISummaryContent;
  sourceIds: string[];
  generatedAt?: string;
  errorCode?: string;
};

function headers(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}
export function listAISummaries(
  accessToken: string,
  patientId: string,
): Promise<{ summaries: AISummary[] }> {
  return http<{ summaries: AISummary[] }>(`/patients/${patientId}/ai-summaries`, {
    headers: headers(accessToken),
  });
}
export function createAISummary(
  accessToken: string,
  patientId: string,
): Promise<{ summary: AISummary }> {
  return http<{ summary: AISummary }>(`/patients/${patientId}/ai-summaries`, {
    method: 'POST',
    headers: headers(accessToken),
  });
}
