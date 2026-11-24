import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { PostgresService } from '../../core/postgres.service';

@Controller('testing')
export class TestingController {
   constructor(
      @InjectConnection()
      private readonly databaseConnection: Connection,
      private readonly postgresService: PostgresService,
   ) {}

   @Delete('all-data')
   @HttpCode(HttpStatus.NO_CONTENT)
   async deleteAll(): Promise<void> {
      const collections = await this.databaseConnection.listCollections();

      const deletePromises = collections.map((collection) =>
         this.databaseConnection.collection(collection.name).deleteMany({}),
      );

      await Promise.all(deletePromises);

      // ***** SQL *******************************************

      const deleteDeviseSessionsSql = 'DELETE FROM device_sessions';

      await this.postgresService.pool.query(deleteDeviseSessionsSql);

      const deleteUsersSql = 'DELETE FROM users';

      await this.postgresService.pool.query(deleteUsersSql);
   }
}
