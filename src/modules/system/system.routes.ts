import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/connection.js';

export const systemRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Service Health Check',
        description: 'Returns service operational status, uptime, memory, and database connectivity.',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              status: { type: 'string', example: 'healthy' },
              uptime: { type: 'number', example: 120.45 },
              timestamp: { type: 'string' },
              database: {
                type: 'object',
                properties: {
                  connected: { type: 'boolean', example: true },
                  metersCount: { type: 'integer', example: 403 },
                  dtsCount: { type: 'integer', example: 40 },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      let metersCount = 0;
      let dtsCount = 0;
      let connected = false;

      try {
        const db = getDb();
        const mRow = db.prepare('SELECT COUNT(*) as count FROM meters').get() as { count: number };
        const dRow = db.prepare('SELECT COUNT(*) as count FROM dts').get() as { count: number };
        metersCount = mRow?.count ?? 0;
        dtsCount = dRow?.count ?? 0;
        connected = true;
      } catch {
        connected = false;
      }

      return reply.status(200).send({
        success: true,
        status: connected ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          connected,
          metersCount,
          dtsCount,
        },
      });
    }
  );
};
