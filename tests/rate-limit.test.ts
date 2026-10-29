import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seeder.js';
import { closeDb } from '../src/db/connection.js';
import { FastifyInstance } from 'fastify';

describe('Rate Limiting Tests', () => {
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

  it('should include standard rate limit headers on responses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['x-ratelimit-limit']);
    assert.ok(res.headers['x-ratelimit-remaining']);
    assert.ok(res.headers['x-ratelimit-reset']);
  });

  it('should enforce auth rate limit of 10 requests per minute on login endpoint', async () => {
    let lastRes;
    for (let i = 0; i < 11; i++) {
      lastRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'operator@urja.local',
          password: 'wrong-password',
        },
      });
    }

    assert.ok(lastRes);
    assert.equal(lastRes.statusCode, 429);
    const body = lastRes.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'RATE_LIMIT_EXCEEDED');
  });
});
