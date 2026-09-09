import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { Allergy } from './models/Allergy.js';
import { Condition } from './models/Condition.js';
import { DoctorPatientAccess } from './models/DoctorPatientAccess.js';
import { Encounter } from './models/Encounter.js';
import { Medication } from './models/Medication.js';
import { Observation } from './models/Observation.js';
import { Patient } from './models/Patient.js';
import { User } from './models/User.js';

describe('medical records API', () => {
  let server: Server;
  let baseUrl: string;
  let patientId: string;
  const password = 'test-password-123';
  const firstDoctorEmail = `records-doctor-one-${Date.now()}@example.com`;
  const secondDoctorEmail = `records-doctor-two-${Date.now()}@example.com`;
  const doctorEmails = [firstDoctorEmail, secondDoctorEmail];

  beforeAll(async () => {
    await connectDatabase();
    server = createApp().listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  afterAll(async () => {
    await Promise.all([
      Encounter.deleteMany({ patientId }),
      Condition.deleteMany({ patientId }),
      Medication.deleteMany({ patientId }),
      Allergy.deleteMany({ patientId }),
      Observation.deleteMany({ patientId }),
      DoctorPatientAccess.deleteMany({ patientId }),
    ]);
    if (patientId) await Patient.deleteOne({ _id: patientId });
    await User.deleteMany({ email: { $in: doctorEmails } });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await mongoose.disconnect();
  });

  async function registerDoctor(email: string): Promise<string> {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Records Doctor', email, password, role: 'doctor' }),
    });
    const result = (await response.json()) as { user: { id: string }; accessToken: string };
    await User.updateOne({ _id: result.user.id }, { $set: { role: 'doctor' } });
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'doctor' }),
    });
    return ((await loginResponse.json()) as { accessToken: string }).accessToken;
  }

  it('supports patient-scoped medical records and rejects unauthorized access', async () => {
    const doctorToken = await registerDoctor(firstDoctorEmail);
    const otherDoctorToken = await registerDoctor(secondDoctorEmail);
    const patientResponse = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        firstName: 'Record',
        lastName: 'Patient',
        dateOfBirth: '1988-04-01',
        sex: 'unknown',
      }),
    });
    patientId = ((await patientResponse.json()) as { patient: { _id: string } }).patient._id;
    assert.equal(patientResponse.status, 201);

    const baseHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    };
    const records = [
      [
        'encounters',
        { type: 'consultation', reason: 'Annual review', occurredAt: '2026-01-01T10:00:00.000Z' },
      ],
      ['conditions', { name: 'Hypertension', status: 'active' }],
      [
        'allergies',
        { substance: 'Penicillin', status: 'active', recordedAt: '2026-01-01T10:00:00.000Z' },
      ],
      [
        'observations',
        {
          type: 'lab',
          normalizedName: 'glucose',
          originalName: 'Glucose',
          value: 92,
          unit: 'mg/dL',
          observedAt: '2026-01-01T10:00:00.000Z',
        },
      ],
    ] as const;
    for (const [resource, body] of records) {
      const response = await fetch(`${baseUrl}/patients/${patientId}/${resource}`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 201);
    }

    const medicationResponse = await fetch(`${baseUrl}/patients/${patientId}/medications`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        name: 'Example Medicine',
        dosage: '10 mg',
        status: 'active',
        startDate: '2026-01-01',
      }),
    });
    const medication = (await medicationResponse.json()) as {
      medication: { _id: string; status: string };
    };
    assert.equal(medicationResponse.status, 201);

    const medicationList = await fetch(`${baseUrl}/patients/${patientId}/medications`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert.equal(medicationList.status, 200);
    assert.equal(
      ((await medicationList.json()) as { medications: unknown[] }).medications.length,
      1,
    );

    const medicationUpdate = await fetch(
      `${baseUrl}/patients/${patientId}/medications/${medication.medication._id}`,
      {
        method: 'PATCH',
        headers: baseHeaders,
        body: JSON.stringify({ name: 'Example Medicine', status: 'discontinued' }),
      },
    );
    assert.equal(medicationUpdate.status, 200);
    const medicationDelete = await fetch(
      `${baseUrl}/patients/${patientId}/medications/${medication.medication._id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${doctorToken}` },
      },
    );
    assert.equal(medicationDelete.status, 204);

    const invalidObservation = await fetch(`${baseUrl}/patients/${patientId}/observations`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        type: 'lab',
        normalizedName: 'glucose',
        originalName: 'Glucose',
        value: 92,
        observedAt: '2026-01-01T10:00:00.000Z',
      }),
    });
    assert.equal(invalidObservation.status, 400);

    const secondObservation = await fetch(`${baseUrl}/patients/${patientId}/observations`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        type: 'lab',
        normalizedName: 'glucose',
        originalName: 'Glucose',
        value: 110,
        unit: 'mg/dL',
        observedAt: '2026-02-01T10:00:00.000Z',
      }),
    });
    assert.equal(secondObservation.status, 201);

    const timelineResponse = await fetch(`${baseUrl}/patients/${patientId}/timeline`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const timeline = (await timelineResponse.json()) as {
      events: Array<{ type: string }>;
      trends: Array<{ normalizedName: string; category: string; evidenceIds: string[] }>;
    };
    assert.equal(timelineResponse.status, 200);
    assert.equal(
      timeline.events.some((event) => event.type === 'observation'),
      true,
    );
    assert.deepEqual(timeline.trends[0], {
      normalizedName: 'glucose',
      unit: 'mg/dL',
      category: 'increasing',
      evidenceIds: timeline.trends[0]?.evidenceIds,
    });

    const forbiddenResponse = await fetch(`${baseUrl}/patients/${patientId}/conditions`, {
      headers: { Authorization: `Bearer ${otherDoctorToken}` },
    });
    assert.equal(forbiddenResponse.status, 403);
  });
});
