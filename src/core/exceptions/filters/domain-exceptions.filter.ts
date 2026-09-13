import {
   ArgumentsHost,
   Catch,
   ExceptionFilter,
   HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../domain-exceptions';
import type { Extension } from '../domain-exceptions';
import { DomainExceptionCode } from '../domain-exception-codes';

type ErrorResponseBody = {
   errorsMessages: Extension[];
};

@Catch(DomainException)
export class DomainHttpExceptionsFilter implements ExceptionFilter<DomainException> {
   catch(exception: DomainException, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      const status = this.mapToHttpStatus(exception.code);
      const responseBody = this.buildResponseBody(exception);

      if (responseBody === null) {
         response.status(status).send();
         return;
      }

      response.status(status).json(responseBody);
   }

   private mapToHttpStatus(code: DomainExceptionCode): number {
      switch (code) {
         case DomainExceptionCode.BadRequest:
         case DomainExceptionCode.ValidationError:
            return HttpStatus.BAD_REQUEST;

         case DomainExceptionCode.Unauthorized:
            return HttpStatus.UNAUTHORIZED;

         case DomainExceptionCode.Forbidden:
            return HttpStatus.FORBIDDEN;

         case DomainExceptionCode.NotFound:
            return HttpStatus.NOT_FOUND;

         case DomainExceptionCode.InternalServerError:
         default:
            return HttpStatus.INTERNAL_SERVER_ERROR;
      }
   }

   private buildResponseBody(
      exception: DomainException,
   ): ErrorResponseBody | null {
      switch (exception.code) {
         case DomainExceptionCode.BadRequest:
         case DomainExceptionCode.ValidationError:
            return {
               errorsMessages: exception.extensions,
            };

         default:
            return null;
      }
   }
}
