import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceSession } from '../domain/device-session.entity';
import type {
   DeviceSessionDocument,
   DeviceSessionModelType,
} from '../domain/device-session.entity';
import { PostgresService } from '../../../core/postgres.service';

@Injectable()
export class DeviceSessionsRepository {
   constructor(
      @InjectModel(DeviceSession.name)
      private readonly DeviceSessionModel: DeviceSessionModelType,
      private readonly postgresService: PostgresService,
   ) {}

   // *********** SQL ************************************************

   async create(session: DeviceSession) {
      const insertSessionSql = `
      INSERT INTO device_sessions (device_id, user_id, ip, title, last_active_date, expiration_date)
      VALUES ($1, $2, $3, $4, $5, $6)
   `;

      const userValues = [
         session.deviceId,
         session.userId,
         session.ip,
         session.title,
         session.lastActiveDate,
         session.expirationDate,
      ];

      await this.postgresService.pool.query(insertSessionSql, userValues);
   }

   async findByDeviceId(deviceId: string): Promise<DeviceSession | null> {
      const findSessionByIdSql =
         'SELECT device_id, user_id, ip, title, last_active_date, expiration_date\n' +
         '\tFROM device_sessions\n' +
         '\tWHERE device_id = $1';

      const resultResponse = await this.postgresService.pool.query(
         findSessionByIdSql,
         [deviceId],
      );

      const finedSession = resultResponse.rows[0];

      if (!finedSession) {
         return null;
      }

      const session = new DeviceSession();

      ((session.deviceId = finedSession.device_id),
         (session.userId = finedSession.user_id),
         (session.ip = finedSession.ip),
         (session.title = finedSession.title),
         (session.lastActiveDate = finedSession.last_active_date),
         (session.expirationDate = finedSession.expiration_date));

      return session;
   }

   async updateDates(session: DeviceSession): Promise<boolean> {
      const updateDateSessionSql =
         'UPDATE device_sessions\n' +
         '\tSET last_active_date= $2, expiration_date= $3\n' +
         '\tWHERE device_id = $1';

      const updateResponse = await this.postgresService.pool.query(
         updateDateSessionSql,
         [session.deviceId, session.lastActiveDate, session.expirationDate],
      );

      return updateResponse.rowCount === 1;
   }

   // *****************************************************************

   /*async findByDeviceId(
      deviceId: string,
   ): Promise<DeviceSessionDocument | null> {
      return this.DeviceSessionModel.findOne({ deviceId });
   }*/

   async save(session: DeviceSessionDocument): Promise<void> {
      await session.save();
   }

   async deleteByDeviceId(deviceId: string): Promise<boolean> {
      const result = await this.DeviceSessionModel.deleteOne({ deviceId });

      return result.deletedCount === 1;
   }

   async deleteOtherSessions(
      userId: string,
      currentDeviceId: string,
   ): Promise<void> {
      await this.DeviceSessionModel.deleteMany({
         userId,
         deviceId: { $ne: currentDeviceId },
      });
   }
}
