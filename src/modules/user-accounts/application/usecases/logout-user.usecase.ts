import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceSessionsRepository } from '../../infrastructure/device-sessions.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class LogoutUserCommand {
   constructor(public readonly deviceId: string) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase implements ICommandHandler<
   LogoutUserCommand,
   void
> {
   constructor(
      private readonly deviceSessionsRepository: DeviceSessionsRepository,
   ) {}

   async execute({ deviceId }: LogoutUserCommand): Promise<void> {
      const isSessionDeleted =
         await this.deviceSessionsRepository.deleteByDeviceId(deviceId);

      if (!isSessionDeleted) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Unauthorized',
         });
      }
   }
}
