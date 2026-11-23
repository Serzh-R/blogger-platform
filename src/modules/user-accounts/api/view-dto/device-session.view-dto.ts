type DeviceSessionRow = {
   ip: string;
   title: string;
   last_active_date: Date;
   device_id: string;
};

export class DeviceSessionViewDto {
   ip: string;
   title: string;
   lastActiveDate: string;
   deviceId: string;

   static mapToView(session: DeviceSessionRow): DeviceSessionViewDto {
      return {
         ip: session.ip,
         title: session.title,
         lastActiveDate: session.last_active_date.toISOString(),
         deviceId: session.device_id,
      };
   }
}
