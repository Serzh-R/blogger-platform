import { ValidationPipe } from '@nestjs/common';
import type { INestApplication, ValidationError } from '@nestjs/common';
import { DomainException } from '../core/exceptions/domain-exceptions';
import type { Extension } from '../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../core/exceptions/domain-exception-codes';

export function errorFormatter(errors: ValidationError[]): Extension[] {
   const formattedErrors: Extension[] = [];

   for (const error of errors) {
      const constraints = error.constraints ?? {};

      for (const message of Object.values(constraints)) {
         formattedErrors.push({
            field: error.property,
            message,
         });
      }
   }

   return formattedErrors;
}

export function pipesSetup(app: INestApplication): void {
   app.useGlobalPipes(
      new ValidationPipe({
         transform: true,

         stopAtFirstError: true,

         exceptionFactory: (errors: ValidationError[]) => {
            const formattedErrors = errorFormatter(errors);

            return new DomainException({
               code: DomainExceptionCode.ValidationError,
               message: 'Validation failed',
               extensions: formattedErrors,
            });
         },
      }),
   );
}
