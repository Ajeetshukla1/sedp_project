type StatusRecord = { id: string; name: string; status: string };
type ObservationRecord = {
  id: string;
  normalizedName: string;
  value: number;
  unit: string;
  observedAt: Date | string;
};
export type RecordConflict = { type: string; message: string; evidenceIds: string[] };

export function detectConflicts(
  allergies: StatusRecord[],
  medications: StatusRecord[],
  observations: ObservationRecord[],
): RecordConflict[] {
  const conflicts: RecordConflict[] = [];
  for (const records of [allergies, medications]) {
    const grouped = new Map<string, StatusRecord[]>();
    for (const record of records)
      grouped.set(record.name.toLowerCase(), [
        ...(grouped.get(record.name.toLowerCase()) ?? []),
        record,
      ]);
    for (const group of grouped.values()) {
      const statuses = new Set(group.map((record) => record.status));
      if (
        statuses.has('active') &&
        (statuses.has('resolved') || statuses.has('discontinued') || statuses.has('completed'))
      )
        conflicts.push({
          type: 'contradictory_status',
          message: `Conflicting statuses recorded for ${group[0]!.name}`,
          evidenceIds: group.map((record) => record.id),
        });
    }
  }
  const seen = new Map<string, ObservationRecord>();
  for (const observation of observations) {
    const key = `${observation.normalizedName}:${observation.unit}:${observation.value}:${new Date(observation.observedAt).toISOString()}`;
    const previous = seen.get(key);
    if (previous)
      conflicts.push({
        type: 'duplicate_observation',
        message: `Duplicate observation recorded for ${observation.normalizedName}`,
        evidenceIds: [previous.id, observation.id],
      });
    else seen.set(key, observation);
  }
  return conflicts;
}
