import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { MetersService } from './meters.service.js';
import {
  meterQuerySchema,
  meterListResponseSchema,
  meterDetailResponseSchema,
  meterStatsResponseSchema,
} from './meters.schema.js';

export const metersRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const metersService = new MetersService();

  fastify.get(
    '/stats',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Meters'],
        summary: 'Meter Aggregation Statistics',
        description: 'Returns aggregated statistics of meters grouped by status, make, phase type, build, and installation type.',
        security: [{ bearerAuth: [] }],
        response: meterStatsResponseSchema,
      },
    },
    async (request, reply) => {
      const stats = metersService.getStats();
      return reply.status(200).send(stats);
    }
  );

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Meters'],
        summary: 'List & Search Meters',
        description:
          'Returns a paginated list of Urja meters with multi-criteria filtering (make, phase, status, DT code, hierarchy) and sorting.',
        security: [{ bearerAuth: [] }],
        querystring: meterQuerySchema,
        response: meterListResponseSchema,
      },
    },
    async (request, reply) => {
      const query = request.query as {
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        q?: string;
        dtCode?: string;
        make?: string;
        phaseType?: string;
        installStatus?: string;
        installType?: string;
        build?: string;
        feederCode?: string;
        substationCode?: string;
        divisionCode?: string;
        circleCode?: string;
        zoneCode?: string;
        hasGeo?: boolean;
      };

      const result = metersService.listMeters(
        {
          q: query.q,
          dtCode: query.dtCode,
          make: query.make,
          phaseType: query.phaseType,
          installStatus: query.installStatus,
          installType: query.installType,
          build: query.build,
          feederCode: query.feederCode,
          substationCode: query.substationCode,
          divisionCode: query.divisionCode,
          circleCode: query.circleCode,
          zoneCode: query.zoneCode,
          hasGeo: query.hasGeo,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
        },
        {
          sortBy: query.sortBy ?? 'meterId',
          sortOrder: query.sortOrder ?? 'asc',
        }
      );

      return reply.status(200).send(result);
    }
  );

  fastify.get(
    '/:meterId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Meters'],
        summary: 'Get Meter Details',
        description: 'Returns complete meter profile joined with transformer capacity and full grid hierarchy.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['meterId'],
          properties: {
            meterId: { type: 'string', description: 'Urja meter ID (e.g. J100000) or serial number' },
          },
        },
        response: meterDetailResponseSchema,
      },
    },
    async (request, reply) => {
      const { meterId } = request.params as { meterId: string };
      const result = metersService.getMeterById(meterId);
      return reply.status(200).send(result);
    }
  );
};
