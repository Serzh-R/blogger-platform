import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceSession } from '../domain/device-session.entity';
import type {
   DeviceSessionDocument,
   DeviceSessionModelType,
} from '../domain/device-session.entity';

@Injectable()
export class DeviceSessionsRepository {
   constructor(
      @InjectModel(DeviceSession.name)
      private readonly DeviceSessionModel: DeviceSessionModelType,
   ) {}

   async findByDeviceId(
      deviceId: string,
   ): Promise<DeviceSessionDocument | null> {
      return this.DeviceSessionModel.findOne({ deviceId });
   }

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
