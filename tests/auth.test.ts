import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seeder.js';
import { closeDb } from '../src/db/connection.js';
import { FastifyInstance } from 'fastify';

describe('Authentication Module Tests', () => {
  let app: FastifyInstance;

  before(async () => {
    seedDatabase();
    app = buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
    closeDb();
  });

  it('should authenticate operator with valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'operator@urja.local',
        password: 'urja-ops-2026',
      },
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    assert.equal(body.data.tokenType, 'Bearer');
    assert.equal(body.data.user.email, 'operator@urja.local');
    assert.equal(body.data.user.role, 'operator');
  });

  it('should reject login with invalid password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'operator@urja.local',
        password: 'wrong-password',
      },
    });

    assert.equal(response.statusCode, 401);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('should reject login with non-existent email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'unknown@urja.local',
        password: 'urja-ops-2026',
      },
    });

    assert.equal(response.statusCode, 401);
    const body = response.json();
    assert.equal(body.success, false);
  });

  it('should return profile on GET /me with valid Bearer token', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'operator@urja.local',
        password: 'urja-ops-2026',
      },
    });
    const { token } = loginRes.json().data;

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    assert.equal(meRes.statusCode, 200);
    const body = meRes.json();
    assert.equal(body.success, true);
    assert.equal(body.data.email, 'operator@urja.local');
  });

  it('should reject GET /me without authorization header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    assert.equal(response.statusCode, 401);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });
});
