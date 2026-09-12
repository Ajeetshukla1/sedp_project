import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { DoctorPatientAccess } from './models/DoctorPatientAccess.js';
import { AuditLog } from './models/AuditLog.js';
import { Patient } from './models/Patient.js';
import { User } from './models/User.js';

describe('patient access API', () => {
  let server: Server;
  let baseUrl: string;
  const password = 'test-password-123';
  const firstDoctorEmail = `doctor-one-${Date.now()}@example.com`;
  const secondDoctorEmail = `doctor-two-${Date.now()}@example.com`;
  const patientCodePrefix = `patient-${Date.now()}`;
  let patientId: string;

  beforeAll(async () => {
    await connectDatabase();
    server = createApp().listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  afterAll(async () => {
    await DoctorPatientAccess.deleteMany({ patientId });
    await AuditLog.deleteMany({ patientId });
    if (patientId) await Patient.deleteOne({ _id: patientId });
    await User.deleteMany({ email: { $in: [firstDoctorEmail, secondDoctorEmail] } });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await mongoose.disconnect();
  });

  async function registerDoctor(email: string): Promise<string> {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Synthetic Doctor', email, password, role: 'doctor' }),
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

  it('limits patient records to authorized doctors', async () => {
    const firstDoctorToken = await registerDoctor(firstDoctorEmail);
    const secondDoctorToken = await registerDoctor(secondDoctorEmail);

    const createResponse = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${firstDoctorToken}` },
      body: JSON.stringify({
        firstName: 'Synthetic',
        lastName: 'Patient',
        dateOfBirth: '1990-01-02',
        sex: 'unknown',
        contact: { email: `${patientCodePrefix.toLowerCase()}@example.com` },
      }),
    });
    const created = (await createResponse.json()) as {
      patient: { _id: string; patientCode: string };
    };
    patientId = created.patient._id;

    assert.equal(createResponse.status, 201);
    assert.match(created.patient.patientCode, /^PT-/);

    const listResponse = await fetch(`${baseUrl}/patients?search=Synthetic`, {
      headers: { Authorization: `Bearer ${firstDoctorToken}` },
    });
    const listed = (await listResponse.json()) as { patients: Array<{ _id: string }> };
    assert.equal(listResponse.status, 200);
    assert.equal(
      listed.patients.some((patient) => patient._id === patientId),
      true,
    );

    const getResponse = await fetch(`${baseUrl}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${firstDoctorToken}` },
    });
    assert.equal(getResponse.status, 200);

    const updateResponse = await fetch(`${baseUrl}/patients/${patientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${firstDoctorToken}` },
      body: JSON.stringify({
        firstName: 'Updated',
        lastName: 'Patient',
        dateOfBirth: '1990-01-02',
        sex: 'unknown',
      }),
    });
    assert.equal(updateResponse.status, 200);

    const forbiddenResponse = await fetch(`${baseUrl}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${secondDoctorToken}` },
    });
    assert.equal(forbiddenResponse.status, 403);

    assert.equal(await AuditLog.countDocuments({ patientId, action: 'patient.created' }), 1);
    assert.equal(await AuditLog.countDocuments({ patientId, action: 'patient.viewed' }), 1);
    assert.equal(await AuditLog.countDocuments({ patientId, action: 'patient.updated' }), 1);
  });
});
