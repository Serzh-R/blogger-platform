import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceSessionsRepository } from '../../infrastructure/device-sessions.repository';

export class DeleteOtherDevicesCommand {
   constructor(
      public readonly userId: string,
      public readonly currentDeviceId: string,
   ) {}
}

@CommandHandler(DeleteOtherDevicesCommand)
export class DeleteOtherDevicesUseCase implements ICommandHandler<
   DeleteOtherDevicesCommand,
   void
> {
   constructor(
      private readonly deviceSessionsRepository: DeviceSessionsRepository,
   ) {}

   async execute({
      userId,
      currentDeviceId,
   }: DeleteOtherDevicesCommand): Promise<void> {
      await this.deviceSessionsRepository.deleteOtherSessions(
         userId,
         currentDeviceId,
      );
   }
}
