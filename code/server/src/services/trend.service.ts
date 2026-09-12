export type ComparableObservation = {
  id: string;
  normalizedName: string;
  value: number;
  unit: string;
  observedAt: Date | string;
};
export type TrendCategory =
  'increasing' | 'decreasing' | 'stable' | 'fluctuating' | 'insufficient_data';
export type ObservationTrend = {
  normalizedName: string;
  unit: string | null;
  category: TrendCategory;
  evidenceIds: string[];
};

export function calculateTrend(observations: ComparableObservation[]): ObservationTrend {
  const ordered = [...observations].sort(
    (left, right) => new Date(left.observedAt).getTime() - new Date(right.observedAt).getTime(),
  );
  const normalizedName = ordered[0]?.normalizedName ?? 'unknown';
  const units = new Set(ordered.map((observation) => observation.unit));
  if (ordered.length < 2 || units.size !== 1)
    return {
      normalizedName,
      unit: ordered[0]?.unit ?? null,
      category: 'insufficient_data',
      evidenceIds: ordered.map((observation) => observation.id),
    };

  const deltas = ordered
    .slice(1)
    .map((observation, index) => observation.value - ordered[index]!.value);
  const tolerance = Math.max(Math.abs(ordered[0]!.value) * 0.05, 0.01);
  const increasing = deltas.every((delta) => delta > tolerance);
  const decreasing = deltas.every((delta) => delta < -tolerance);
  const stable = deltas.every((delta) => Math.abs(delta) <= tolerance);
  return {
    normalizedName,
    unit: ordered[0]!.unit,
    category: increasing
      ? 'increasing'
      : decreasing
        ? 'decreasing'
        : stable
          ? 'stable'
          : 'fluctuating',
    evidenceIds: ordered.map((observation) => observation.id),
  };
}

export function calculateTrends(observations: ComparableObservation[]): ObservationTrend[] {
  const groups = new Map<string, ComparableObservation[]>();
  for (const observation of observations)
    groups.set(observation.normalizedName, [
      ...(groups.get(observation.normalizedName) ?? []),
      observation,
    ]);
  return [...groups.values()].map(calculateTrend);
}
