import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { DtsService } from './dts.service.js';
import { dtListQuerySchema, dtListResponseSchema, dtDetailResponseSchema } from './dts.schema.js';

export const dtsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const dtsService = new DtsService();

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Distribution Transformers'],
        summary: 'List Distribution Transformers',
        description:
          'Returns a paginated list of distribution transformers with connected meter counts and filtering by feeder or capacity.',
        security: [{ bearerAuth: [] }],
        querystring: dtListQuerySchema,
        response: dtListResponseSchema,
      },
    },
    async (request, reply) => {
      const query = request.query as {
        page?: number;
        pageSize?: number;
        feederCode?: string;
        minCapacityKva?: number;
        maxCapacityKva?: number;
        q?: string;
      };

      const result = dtsService.listDts(
        {
          feederCode: query.feederCode,
          minCapacityKva: query.minCapacityKva,
          maxCapacityKva: query.maxCapacityKva,
          q: query.q,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
        }
      );

      return reply.status(200).send(result);
    }
  );

  fastify.get(
    '/:code',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Distribution Transformers'],
        summary: 'Get Distribution Transformer Detail',
        description: 'Returns transformer details along with all assigned meters.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', description: 'Transformer code (e.g. DT-001)' },
          },
        },
        response: dtDetailResponseSchema,
      },
    },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const result = dtsService.getDtByCode(code);
      return reply.status(200).send(result);
    }
  );
};
