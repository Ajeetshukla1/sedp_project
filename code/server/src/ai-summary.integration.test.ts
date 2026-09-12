import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { AISummary } from './models/AISummary.js';
import { DoctorPatientAccess } from './models/DoctorPatientAccess.js';
import { Observation } from './models/Observation.js';
import { Patient } from './models/Patient.js';
import { User } from './models/User.js';
import { generateAISummary } from './services/ai-summary.service.js';
import { type AIProvider } from './services/ai-provider.service.js';

describe('AI summary service', () => {
  let server: Server;
  let baseUrl: string;
  let patientId: string;
  let doctorId: string;
  const email = `ai-doctor-${Date.now()}@example.com`;

  beforeAll(async () => {
    await connectDatabase();
    server = createApp().listen(0);
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  });

  afterAll(async () => {
    await AISummary.deleteMany({ patientId });
    await Observation.deleteMany({ patientId });
    await DoctorPatientAccess.deleteMany({ patientId });
    if (patientId) await Patient.deleteOne({ _id: patientId });
    if (doctorId) await User.deleteOne({ _id: doctorId });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await mongoose.disconnect();
  });

  it('persists a source-grounded summary from a mocked provider', async () => {
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AI Doctor',
        email,
        password: 'test-password-123',
        role: 'doctor',
      }),
    });
    const registered = (await registerResponse.json()) as { user: { id: string } };
    doctorId = registered.user.id;
    await User.updateOne({ _id: doctorId }, { $set: { role: 'doctor' } });
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'test-password-123', role: 'doctor' }),
    });
    const doctorToken = ((await loginResponse.json()) as { accessToken: string }).accessToken;
    const patient = await Patient.create({
      firstName: 'AI',
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-01'),
      sex: 'unknown',
    });
    patientId = patient._id.toString();
    await DoctorPatientAccess.create({ doctorId, patientId, status: 'active' });
    const observation = await Observation.create({
      patientId,
      type: 'lab',
      normalizedName: 'glucose',
      originalName: 'Glucose',
      value: 94,
      unit: 'mg/dL',
      observedAt: new Date(),
    });
    const provider: AIProvider = {
      model: 'mock-model',
      async generate(context) {
        const sourceId = (context.observations[0] as { id: string }).id;
        return {
          overview: [{ text: 'One glucose observation is available.', sourceIds: [sourceId] }],
          relevantHistory: [],
          currentConditions: [],
          medications: [],
          allergies: [],
          recentInvestigations: [],
          importantChanges: [],
          trends: [],
          conflictsMissingInformation: [],
          evidence: [{ sourceId, description: 'Glucose observation' }],
        };
      },
    };
    const summary = await generateAISummary(
      patientId,
      { userId: doctorId, role: 'doctor' },
      provider,
    );
    assert.equal(summary.status, 'completed');
    assert.deepEqual(summary.sourceIds, [observation._id.toString()]);
    assert.equal(
      (summary.summary as { overview: Array<{ text: string }> }).overview[0]?.text,
      'One glucose observation is available.',
    );
    const detailResponse = await fetch(`${baseUrl}/ai-summaries/${summary._id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert.equal(detailResponse.status, 200);
    await assert.rejects(
      generateAISummary(
        patientId,
        { userId: doctorId, role: 'doctor' },
        {
          model: 'invalid-mock',
          generate: async () => ({
            overview: [{ text: 'Unsupported claim', sourceIds: ['missing-source'] }],
          }),
        },
      ),
      /AI_GENERATION_FAILED/,
    );
    assert.equal(await AISummary.countDocuments({ patientId, status: 'failed' }), 1);
  });
});
