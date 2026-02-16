import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export interface ApiError extends Error {
  statusCode: number;
  code: string;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export function createError(statusCode: number, code: string, message: string): AppError {
  return new AppError(statusCode, code, message);
}

export const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', const: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['code', 'message'],
    },
  },
};

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const statusCode = error.statusCode || 500;
  const isAppError = error instanceof AppError;

  // Log internal errors
  if (statusCode >= 500) {
    request.log.error({ error }, 'Internal server error');
  }

  // SQLite unique constraint violation
  if (error.message?.includes('UNIQUE constraint failed')) {
    reply.status(409).send({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'This repository already exists',
      },
    });
    return;
  }

  // SQLite foreign key violation
  if (error.message?.includes('FOREIGN KEY constraint failed')) {
    reply.status(400).send({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced resource not found',
      },
    });
    return;
  }

  // Validation error from Fastify
  if (error.validation) {
    reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
      },
    });
    return;
  }

  reply.status(statusCode).send({
    success: false,
    error: {
      code: isAppError ? (error as AppError).code : 'INTERNAL_ERROR',
      message: statusCode >= 500 && !isAppError
        ? 'An unexpected error occurred'
        : error.message,
    },
  });
}
