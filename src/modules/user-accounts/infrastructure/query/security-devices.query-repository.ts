import { Injectable } from '@nestjs/common';
import { DeviceSessionViewDto } from '../../api/view-dto/device-session.view-dto';
import { PostgresService } from '../../../../core/postgres.service';

@Injectable()
export class SecurityDevicesQueryRepository {
   constructor(private readonly postgresService: PostgresService) {}

   async findAllByUserId(userId: string): Promise<DeviceSessionViewDto[]> {
      const findAllActiveSessionByUserId =
         'SELECT device_id, ip, title, last_active_date\n' +
         '\tFROM device_sessions\n' +
         '\tWHERE user_id = $1 AND expiration_date > now()';

      const resultResponse = await this.postgresService.pool.query(
         findAllActiveSessionByUserId,
         [userId],
      );

      const finedSession = resultResponse.rows;

      return finedSession.map((session) =>
         DeviceSessionViewDto.mapToView(session),
      );
   }
}
