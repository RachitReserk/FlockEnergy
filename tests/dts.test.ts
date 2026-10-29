import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seeder.js';
import { closeDb } from '../src/db/connection.js';
import { FastifyInstance } from 'fastify';

describe('Distribution Transformers Module Tests', () => {
  let app: FastifyInstance;
  let authToken: string;

  before(async () => {
    seedDatabase();
    app = buildApp();
    await app.ready();

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'operator@urja.local',
        password: 'urja-ops-2026',
      },
    });
    authToken = loginRes.json().data.token;
  });

  after(async () => {
    await app.close();
    closeDb();
  });

  it('should list distribution transformers with connected meterCount', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dts?page=1&pageSize=10',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.length, 10);
    assert.equal(body.pagination.totalItems, 40);
    assert.equal(body.pagination.totalPages, 4);

    const first = body.data[0];
    assert.ok(first.code);
    assert.ok(first.name);
    assert.ok(first.feederCode);
    assert.ok(typeof first.capacityKva === 'number');
    assert.ok(typeof first.meterCount === 'number');
  });

  it('should filter DTs by feeder code', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dts?feederCode=F-001',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.data.length > 0);
    for (const dt of body.data) {
      assert.equal(dt.feederCode, 'F-001');
    }
  });

  it('should filter DTs by capacity range', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dts?minCapacityKva=100&maxCapacityKva=250',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.data.length > 0);
    for (const dt of body.data) {
      assert.ok(dt.capacityKva >= 100);
      assert.ok(dt.capacityKva <= 250);
    }
  });

  it('should return single DT details and list of assigned meters', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dts/DT-001',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.code, 'DT-001');
    assert.equal(body.data.name, 'Malviya Nagar DT 1');
    assert.ok(Array.isArray(body.data.meters));
    assert.ok(body.data.meters.length > 0);
    assert.equal(body.data.meterCount, body.data.meters.length);
  });

  it('should return 404 for non-existent DT code', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dts/DT-999',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 404);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});
