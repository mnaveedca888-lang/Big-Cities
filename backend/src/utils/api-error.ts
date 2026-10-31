import type { FastifyBaseLogger, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

type KnownApiError = Error & { code?: string; statusCode?: number };

export function sendApiError(reply: FastifyReply, logger: FastifyBaseLogger, error: unknown, context: string) {
  const known = error as KnownApiError;
  let statusCode = 500;
  let message = 'Internal server error.';

  if (error instanceof ZodError) {
    statusCode = 400;
    message = error.issues.map((issue) => issue.message).join('; ');
  } else if (known?.code === 'P2002') {
    statusCode = 409;
    message = 'A record with the same unique value already exists.';
  } else if (known?.code === 'P2003' || known?.code === 'P2014') {
    statusCode = 409;
    message = 'The change conflicts with related records.';
  } else if (known?.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
  } else if ([400, 401, 403, 404, 409, 413, 415, 503].includes(known?.statusCode ?? 0)) {
    statusCode = known.statusCode!;
    message = known.message || message;
  }

  if (statusCode >= 500) logger.error({ err: error }, context);
  return reply.code(statusCode).send({ success: false, error: { message } });
}
