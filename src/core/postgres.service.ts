import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { CoreConfig } from './core.config';

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
   readonly pool: Pool;

   constructor(config: CoreConfig) {
      this.pool = new Pool({
         host: config.pgHost,
         port: config.pgPort,
         database: config.pgDatabase,
         user: config.pgUser,
         password: config.pgPassword,
      });
   }

   async onModuleInit(): Promise<void> {
      const result = await this.pool.query(
         'SELECT current_database() AS database, current_user AS username',
      );
      console.log(result.rows);
   }

   async onModuleDestroy(): Promise<void> {
      await this.pool.end();
   }
}
