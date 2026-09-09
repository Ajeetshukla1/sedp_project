import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { Patient } from './models/Patient.js';
import { User } from './models/User.js';

describe('authentication API', () => {
  let server: Server;
  let baseUrl: string;
  let userId: string;
  const email = `integration-${Date.now()}@example.com`;
  const password = 'test-password-123';

  beforeAll(async () => {
    await connectDatabase();
    server = createApp().listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  afterAll(async () => {
    await Patient.deleteMany({ userId });
    await User.deleteMany({ email });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await mongoose.disconnect();
  });

  async function request(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${baseUrl}${path}`, init);
  }

  it('rejects protected requests without an access token', async () => {
    const response = await request('/auth/me');
    assert.equal(response.status, 401);
  });

  it('registers, authenticates, refreshes, and logs out a user', async () => {
    const registerResponse = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Integration Test', email, password, role: 'patient' }),
    });
    const registration = (await registerResponse.json()) as {
      user: { id: string; email: string; role: string; passwordHash?: string };
      accessToken: string;
    };
    const refreshCookie = registerResponse.headers.getSetCookie()[0]?.split(';')[0];

    assert.equal(registerResponse.status, 201);
    assert.equal(registration.user.email, email);
    assert.equal(registration.user.role, 'patient');
    userId = registration.user.id;
    assert.ok(await Patient.exists({ userId }));
    assert.equal('passwordHash' in registration.user, false);
    assert.ok(registration.accessToken);
    assert.ok(refreshCookie);

    const meResponse = await request('/auth/me', {
      headers: { Authorization: `Bearer ${registration.accessToken}` },
    });
    assert.equal(meResponse.status, 200);
    assert.deepEqual((await meResponse.json()).user, registration.user);

    const refreshResponse = await request('/auth/refresh', {
      method: 'POST',
      headers: { Cookie: refreshCookie },
    });
    const rotatedCookie = refreshResponse.headers.getSetCookie()[0]?.split(';')[0];
    assert.equal(refreshResponse.status, 200);
    assert.ok(rotatedCookie);
    assert.notEqual(rotatedCookie, refreshCookie);

    const logoutResponse = await request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(logoutResponse.status, 204);

    const loginResponse = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'patient' }),
    });
    assert.equal(loginResponse.status, 200);
    assert.equal((await loginResponse.json()).user.email, email);

    await User.updateOne({ email }, { $set: { role: 'doctor' } });

    const patientLoginResponse = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'patient' }),
    });
    assert.equal(patientLoginResponse.status, 401);

    const doctorLoginResponse = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'doctor' }),
    });
    assert.equal(doctorLoginResponse.status, 200);
  });
});
