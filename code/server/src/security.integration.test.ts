import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { AuditLog } from './models/AuditLog.js';
import { User } from './models/User.js';

describe('security boundaries', () => {
  let server: Server;
  let baseUrl: string;
  let userId: string;
  const email = `security-${Date.now()}@example.com`;

  beforeAll(async () => {
    await connectDatabase();
    server = createApp().listen(0);
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  });

  afterAll(async () => {
    await AuditLog.deleteMany({ actorUserId: userId });
    await User.deleteOne({ _id: userId });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await mongoose.disconnect();
  });

  it('sets security headers and request IDs', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('x-request-id'));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(response.headers.get('content-security-policy'));
  });

  it('blocks role escalation and keeps credentials out of responses', async () => {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'security-test-request' },
      body: JSON.stringify({
        name: 'Security Test',
        email,
        password: 'test-password-123',
        role: 'admin',
      }),
    });
    assert.equal(response.status, 400);

    const registrationResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': 'security-registration-request',
      },
      body: JSON.stringify({
        name: 'Security Test',
        email,
        password: 'test-password-123',
        role: 'patient',
      }),
    });
    const result = (await registrationResponse.json()) as {
      user: { id: string; role: string; passwordHash?: string };
      accessToken: string;
    };
    userId = result.user.id;
    assert.equal(registrationResponse.status, 201);
    assert.equal(result.user.role, 'patient');
    assert.equal('passwordHash' in result.user, false);
    assert.ok(!result.accessToken.includes('development-access-secret'));
    assert.equal(registrationResponse.headers.get('x-request-id'), 'security-registration-request');
    assert.equal(
      await AuditLog.countDocuments({ actorUserId: userId, action: 'auth.registered' }),
      1,
    );
  });

  it('rejects unauthenticated protected API calls', async () => {
    const response = await fetch(`${baseUrl}/patients`);
    assert.equal(response.status, 401);
  });
});
