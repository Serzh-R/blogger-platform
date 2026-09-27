import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import type { CreateDeviceSessionDomainDto } from './dto/create-device-session.domain-dto';

@Schema({
   collection: 'device-sessions',
   versionKey: false,
})
export class DeviceSession {
   @Prop({ type: String, required: true })
   userId: string;

   @Prop({ type: String, required: true })
   deviceId: string;

   @Prop({ type: String, required: true })
   ip: string;

   @Prop({ type: String, required: true })
   title: string;

   @Prop({ type: Date, required: true })
   lastActiveDate: Date;

   @Prop({ type: Date, required: true })
   expirationDate: Date;

   static createInstance(
      dto: CreateDeviceSessionDomainDto,
   ): DeviceSessionDocument {
      const session = new this();

      session.userId = dto.userId;
      session.deviceId = dto.deviceId;
      session.ip = dto.ip;
      session.title = dto.title;
      session.lastActiveDate = dto.lastActiveDate;
      session.expirationDate = dto.expirationDate;

      return session as DeviceSessionDocument;
   }

   updateDates(lastActiveDate: Date, expirationDate: Date): void {
      this.lastActiveDate = lastActiveDate;
      this.expirationDate = expirationDate;
   }
}

export const DeviceSessionSchema = SchemaFactory.createForClass(DeviceSession);

DeviceSessionSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });

DeviceSessionSchema.loadClass(DeviceSession);

export type DeviceSessionDocument = HydratedDocument<DeviceSession>;

export type DeviceSessionModelType = Model<DeviceSession> &
   typeof DeviceSession;
