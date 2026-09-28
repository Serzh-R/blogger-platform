import type { DeviceSessionDocument } from '../../domain/device-session.entity';

export class DeviceSessionViewDto {
   ip: string;
   title: string;
   lastActiveDate: string;
   deviceId: string;

   static mapToView(session: DeviceSessionDocument): DeviceSessionViewDto {
      return {
         ip: session.ip,
         title: session.title,
         lastActiveDate: session.lastActiveDate.toISOString(),
         deviceId: session.deviceId,
      };
   }
}
