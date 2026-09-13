import type { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { pipesSetup } from './pipes.setup';
import { DomainHttpExceptionsFilter } from '../core/exceptions/filters/domain-exceptions.filter';
import { AllExceptionsFilter } from '../core/exceptions/filters/all-exceptions.filter';

export function appSetup(app: INestApplication): void {
   pipesSetup(app);
   globalPrefixSetup(app);

   app.useGlobalFilters(
      new AllExceptionsFilter(),
      new DomainHttpExceptionsFilter(),
   );
}
