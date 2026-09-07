import type { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { pipesSetup } from './pipes.setup';

export function appSetup(app: INestApplication): void {
   pipesSetup(app);
   globalPrefixSetup(app);
}
