export type NormalizedObservation = {
  type: 'lab';
  normalizedName: string;
  originalName: string;
  value: number;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
};

const knownNames = [
  'hba1c',
  'glucose',
  'hemoglobin',
  'creatinine',
  'cholesterol',
  'blood pressure',
] as const;
const nameAliases: Record<string, string> = {
  hba1c: 'hba1c',
  glucose: 'glucose',
  hemoglobin: 'hemoglobin',
  creatinine: 'creatinine',
  cholesterol: 'cholesterol',
  'blood pressure': 'blood pressure',
};

export function normalizeObservations(text: string): NormalizedObservation[] {
  const observations: NormalizedObservation[] = [];
  for (const line of text.split(/\r?\n/)) {
    const nameMatch = line.match(new RegExp(`\\b(${knownNames.join('|')})\\b`, 'i'));
    if (!nameMatch) continue;
    const originalName = nameMatch[1];
    if (!originalName) continue;
    const escapedName = originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const valueMatch = line.match(
      new RegExp(`${escapedName}\\s*[:=-]?\\s*(-?\\d+(?:\\.\\d+)?)\\s*([a-zA-Z%/]+)`, 'i'),
    );
    if (!valueMatch) continue;
    const value = valueMatch[1];
    const unit = valueMatch[2];
    if (!value || !unit) continue;
    const rangeMatch = line.match(
      /(?:ref(?:erence)?|range)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/i,
    );
    observations.push({
      type: 'lab',
      originalName,
      normalizedName: nameAliases[originalName.toLowerCase()] ?? originalName.toLowerCase(),
      value: Number(value),
      unit,
      ...(rangeMatch
        ? { referenceLow: Number(rangeMatch[1]), referenceHigh: Number(rangeMatch[2]) }
        : {}),
    });
  }
  return observations;
}
