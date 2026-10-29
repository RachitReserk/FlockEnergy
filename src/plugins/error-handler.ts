import { FastifyError, FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../common/errors.js';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }

    const fastifyErr = error as FastifyError;
    if (fastifyErr.validation) {
      const details = fastifyErr.validation.map((v) => ({
        field: v.instancePath || (v.params as { missingProperty?: string })?.missingProperty || 'unknown',
        message: v.message,
        keyword: v.keyword,
        params: v.params,
      }));

      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: fastifyErr.message || 'Request validation failed',
          details,
        },
      });
    }

    if (fastifyErr.statusCode === 429 || fastifyErr.code === 'FST_ERR_RATE_LIMIT_EXCEEDED') {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: fastifyErr.message || 'Rate limit exceeded',
        },
      });
    }

    if (fastifyErr.statusCode === 404) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route '${request.method} ${request.url}' not found`,
        },
      });
    }

    request.log.error({ err: error }, 'Unhandled server error');

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred',
      },
    });
  });

  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route '${request.method} ${request.url}' not found`,
      },
    });
  });
};

export default fp(errorHandlerPlugin, {
  name: 'error-handler-plugin',
});
