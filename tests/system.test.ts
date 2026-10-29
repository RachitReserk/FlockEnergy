import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seeder.js';
import { closeDb } from '../src/db/connection.js';
import { FastifyInstance } from 'fastify';

describe('System, Documentation & Health Tests', () => {
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

  it('should return 200 on GET /health with database connectivity status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.status, 'healthy');
    assert.equal(body.database.connected, true);
    assert.equal(body.database.metersCount, 403);
    assert.equal(body.database.dtsCount, 40);
  });

  it('should return OpenAPI 3.1 JSON on GET /openapi.json', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/openapi.json',
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.openapi, '3.1.0');
    assert.equal(body.info.title, 'Urja Meter Ops API Service');
    assert.ok(body.paths['/api/v1/meters/']);
    assert.ok(body.paths['/api/v1/dts/']);
    assert.ok(body.paths['/api/v1/auth/login']);
  });

  it('should return Swagger UI on GET /docs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/docs/',
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('text/html'));
    assert.ok(res.body.includes('swagger-ui'));
  });

  it('should return uniform 404 error envelope for undefined routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/undefined-endpoint-test',
    });

    assert.equal(res.statusCode, 404);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.ok(body.error.message.includes('not found'));
  });
});
