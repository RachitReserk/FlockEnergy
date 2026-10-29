import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seeder.js';
import { closeDb } from '../src/db/connection.js';
import { FastifyInstance } from 'fastify';

describe('Meters Module Tests', () => {
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

  it('should reject unauthenticated access to /api/v1/meters', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters',
    });
    assert.equal(res.statusCode, 401);
  });

  it('should return paginated meters list (default 20 items)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.length, 20);
    assert.equal(body.pagination.page, 1);
    assert.equal(body.pagination.pageSize, 20);
    assert.equal(body.pagination.totalItems, 403);
    assert.equal(body.pagination.totalPages, 21);
    assert.equal(body.pagination.hasNextPage, true);
    assert.equal(body.pagination.hasPrevPage, false);
  });

  it('should support custom pagination parameters', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters?page=2&pageSize=10',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.data.length, 10);
    assert.equal(body.pagination.page, 2);
    assert.equal(body.pagination.pageSize, 10);
    assert.equal(body.pagination.totalPages, 41);
    assert.equal(body.pagination.hasNextPage, true);
    assert.equal(body.pagination.hasPrevPage, true);
  });

  it('should reject invalid pageSize exceeding max 100', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters?pageSize=150',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 400);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  it('should search meters by meterId or serialNo using query param q', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters?q=J100000',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.data.length >= 1);
    assert.equal(body.data[0].meterId, 'J100000');
    assert.equal(body.data[0].serialNo, 'SE33962');
  });

  it('should filter meters by manufacturer (make)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters?make=HPL',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.data.length > 0);
    for (const item of body.data) {
      assert.equal(item.make, 'HPL');
    }
  });

  it('should filter meters by phaseType and installStatus', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters?phaseType=single&installStatus=Installed',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.data.length > 0);
    for (const item of body.data) {
      assert.equal(item.phaseType, 'single');
      assert.equal(item.installStatus, 'Installed');
    }
  });

  it('should filter meters by distribution transformer code (dtCode)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters?dtCode=DT-001',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.data.length > 0);
    for (const item of body.data) {
      assert.equal(item.dtCode, 'DT-001');
      assert.equal(item.dtName, 'Malviya Nagar DT 1');
      assert.equal(item.dtCapacityKva, 100);
    }
  });

  it('should sort meters descending by meterId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters?sortBy=meterId&sortOrder=desc&pageSize=5',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.data.length, 5);
    const ids = body.data.map((m: { meterId: string }) => m.meterId);
    const sorted = [...ids].sort().reverse();
    assert.deepEqual(ids, sorted);
  });

  it('should return a single meter detail on GET /api/v1/meters/:meterId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters/J100000',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.meterId, 'J100000');
    assert.equal(body.data.serialNo, 'SE33962');
    assert.equal(body.data.dtCode, 'DT-001');
    assert.equal(body.data.dtCapacityKva, 100);
    assert.ok(body.data.hierarchy);
    assert.ok(body.data.geo);
  });

  it('should return 404 for non-existent meter ID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters/NON_EXISTENT_METER',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 404);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  it('should return aggregated stats on GET /api/v1/meters/stats', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/meters/stats',
      headers: { authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.totalMeters, 403);
    assert.ok(body.data.byStatus);
    assert.ok(body.data.byMake);
    assert.ok(body.data.byPhaseType);
    assert.ok(body.data.byBuild);
    assert.ok(body.data.byInstallType);
  });
});
