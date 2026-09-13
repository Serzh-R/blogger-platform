import {
   ArgumentsHost,
   Catch,
   ExceptionFilter,
   HttpException,
   HttpStatus,
   Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorResponseBody = {
   statusCode: number;
   message: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
   private readonly logger = new Logger(AllExceptionsFilter.name);

   catch(exception: unknown, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      if (exception instanceof HttpException) {
         const status = exception.getStatus();
         const exceptionResponse = exception.getResponse();

         if (typeof exceptionResponse === 'string') {
            response.status(status).json({
               statusCode: status,
               message: exceptionResponse,
            });
         } else {
            response.status(status).json(exceptionResponse);
         }

         return;
      }

      const message = this.getErrorMessage(exception);

      if (exception instanceof Error) {
         this.logger.error(
            `${request.method} ${request.url}: ${message}`,
            exception.stack,
         );
      } else {
         this.logger.error(`${request.method} ${request.url}: ${message}`);
      }

      const status = HttpStatus.INTERNAL_SERVER_ERROR;

      const responseBody = this.buildResponseBody();

      response.status(status).json(responseBody);
   }

   private getErrorMessage(exception: unknown): string {
      if (exception instanceof Error) {
         return exception.message || 'Unknown exception occurred.';
      }

      if (typeof exception === 'string') {
         return exception || 'Unknown exception occurred.';
      }

      return 'Unknown exception occurred.';
   }

   private buildResponseBody(): ErrorResponseBody {
      return {
         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
         message: 'Internal server error',
      };
   }
}
