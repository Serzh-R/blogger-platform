import type { INestApplication } from '@nestjs/common';

export const GLOBAL_PREFIX = 'api';

export function globalPrefixSetup(app: INestApplication): void {
   app.setGlobalPrefix(GLOBAL_PREFIX);
}
