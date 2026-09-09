import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { detectConflicts } from './services/conflict.service.js';

describe('detectConflicts', () => {
  it('detects contradictory statuses and duplicate observations', () => {
    const conflicts = detectConflicts(
      [
        { id: 'a', name: 'Penicillin', status: 'active' },
        { id: 'b', name: 'Penicillin', status: 'resolved' },
      ],
      [
        { id: 'c', name: 'Medicine', status: 'active' },
        { id: 'd', name: 'Medicine', status: 'discontinued' },
      ],
      [
        { id: 'e', normalizedName: 'glucose', value: 90, unit: 'mg/dL', observedAt: '2026-01-01' },
        { id: 'f', normalizedName: 'glucose', value: 90, unit: 'mg/dL', observedAt: '2026-01-01' },
      ],
    );
    assert.equal(conflicts.length, 3);
    assert.deepEqual(
      conflicts.map((conflict) => conflict.type),
      ['contradictory_status', 'contradictory_status', 'duplicate_observation'],
    );
  });
});
