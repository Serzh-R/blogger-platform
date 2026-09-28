import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceSessionsRepository } from '../../infrastructure/device-sessions.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class DeleteDeviceByIdCommand {
   constructor(
      public readonly deviceId: string,
      public readonly userId: string,
   ) {}
}

@CommandHandler(DeleteDeviceByIdCommand)
export class DeleteDeviceByIdUseCase implements ICommandHandler<
   DeleteDeviceByIdCommand,
   void
> {
   constructor(
      private readonly deviceSessionsRepository: DeviceSessionsRepository,
   ) {}

   async execute({ deviceId, userId }: DeleteDeviceByIdCommand): Promise<void> {
      const session =
         await this.deviceSessionsRepository.findByDeviceId(deviceId);

      if (!session) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Device session not found',
         });
      }

      if (session.userId !== userId) {
         throw new DomainException({
            code: DomainExceptionCode.Forbidden,
            message: 'Device session belongs to another user',
         });
      }

      const isDeleted =
         await this.deviceSessionsRepository.deleteByDeviceId(deviceId);

      if (!isDeleted) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Device session not found',
         });
      }
   }
}
