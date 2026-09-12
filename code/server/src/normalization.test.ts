import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { normalizeObservations } from './services/normalization.service.js';

describe('normalizeObservations', () => {
  it('normalizes supported lab values and preserves reference ranges', () => {
    const [observation] = normalizeObservations('HbA1c: 6.4 % Reference: 4-5.6');
    assert.deepEqual(observation, {
      type: 'lab',
      normalizedName: 'hba1c',
      originalName: 'HbA1c',
      value: 6.4,
      unit: '%',
      referenceLow: 4,
      referenceHigh: 5.6,
    });
  });

  it('does not create an observation when a value is missing', () => {
    assert.deepEqual(normalizeObservations('Glucose: not available'), []);
  });
});
