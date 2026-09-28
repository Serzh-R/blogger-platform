import type { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { pipesSetup } from './pipes.setup';
import { DomainHttpExceptionsFilter } from '../core/exceptions/filters/domain-exceptions.filter';
import { AllExceptionsFilter } from '../core/exceptions/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';

export function appSetup(app: INestApplication): void {
   app.use(cookieParser());

   pipesSetup(app);
   globalPrefixSetup(app);

   app.useGlobalFilters(
      new AllExceptionsFilter(),
      new DomainHttpExceptionsFilter(),
   );
}
