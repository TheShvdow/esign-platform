import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface ApiErrorResponse {
  code: string;
  message: string;
  details?: string[];
  path: string;
  timestamp: string;
  requestId: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: Error | HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const { code, message, details } = this.extractErrorPayload(
      status,
      exception,
      exceptionResponse,
    );

    const requestId = request.headers['x-request-id'];

    const payload: ApiErrorResponse = {
      code,
      message,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId:
        typeof requestId === 'string' && requestId.length > 0 ? requestId : randomUUID(),
    };

    response.status(status).json(payload);
  }

  private extractErrorPayload(
    status: number,
    exception: Error | HttpException,
    exceptionResponse: string | object | null,
  ): { code: string; message: string; details?: string[] } {
    if (typeof exceptionResponse === 'string') {
      return {
        code: this.mapHttpStatusToCode(status),
        message: exceptionResponse,
      };
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const messageValue = (exceptionResponse as { message: string | string[] }).message;
      if (Array.isArray(messageValue)) {
        return {
          code: this.mapHttpStatusToCode(status),
          message: 'Validation failed',
          details: messageValue,
        };
      }

      return {
        code: this.mapHttpStatusToCode(status),
        message: messageValue,
      };
    }

    return {
      code: this.mapHttpStatusToCode(status),
      message:
        exception instanceof Error
          ? exception.message
          : 'An unexpected error occurred',
    };
  }

  private mapHttpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return map[status] ?? 'UNEXPECTED_ERROR';
  }
}
