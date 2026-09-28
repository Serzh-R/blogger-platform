import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceSession } from '../../domain/device-session.entity';
import type { DeviceSessionModelType } from '../../domain/device-session.entity';
import { DeviceSessionViewDto } from '../../api/view-dto/device-session.view-dto';

@Injectable()
export class SecurityDevicesQueryRepository {
   constructor(
      @InjectModel(DeviceSession.name)
      private readonly DeviceSessionModel: DeviceSessionModelType,
   ) {}

   async findAllByUserId(userId: string): Promise<DeviceSessionViewDto[]> {
      const sessions = await this.DeviceSessionModel.find({ userId });

      return sessions.map((session) => DeviceSessionViewDto.mapToView(session));
   }
}
