import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';
import { PostgresService } from './postgres.service';

@Global()
@Module({
   providers: [CoreConfig, PostgresService],
   exports: [CoreConfig, PostgresService],
})
export class CoreModule {}
