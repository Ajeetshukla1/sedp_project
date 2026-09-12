import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { calculateTrend } from './services/trend.service.js';

const base = { normalizedName: 'glucose', unit: 'mg/dL' };
function observation(id: string, value: number, day: string) {
  return { ...base, id, value, observedAt: day };
}

describe('calculateTrend', () => {
  it('requires two compatible observations', () => {
    assert.equal(
      calculateTrend([observation('a', 90, '2026-01-01')]).category,
      'insufficient_data',
    );
    assert.equal(
      calculateTrend([
        observation('a', 90, '2026-01-01'),
        { ...observation('b', 100, '2026-01-02'), unit: 'mmol/L' },
      ]).category,
      'insufficient_data',
    );
  });
  it('classifies increasing, decreasing, stable, and fluctuating values', () => {
    assert.equal(
      calculateTrend([observation('a', 90, '2026-01-01'), observation('b', 100, '2026-01-02')])
        .category,
      'increasing',
    );
    assert.equal(
      calculateTrend([observation('a', 100, '2026-01-01'), observation('b', 90, '2026-01-02')])
        .category,
      'decreasing',
    );
    assert.equal(
      calculateTrend([observation('a', 100, '2026-01-01'), observation('b', 102, '2026-01-02')])
        .category,
      'stable',
    );
    assert.equal(
      calculateTrend([
        observation('a', 90, '2026-01-01'),
        observation('b', 110, '2026-01-02'),
        observation('c', 95, '2026-01-03'),
      ]).category,
      'fluctuating',
    );
  });
});
