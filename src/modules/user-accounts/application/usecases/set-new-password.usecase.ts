import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NewPasswordInputDto } from '../../api/input-dto/new-password.input-dto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { BcryptService } from '../bcrypt.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class SetNewPasswordCommand {
   constructor(public readonly dto: NewPasswordInputDto) {}
}

@CommandHandler(SetNewPasswordCommand)
export class SetNewPasswordUseCase implements ICommandHandler<
   SetNewPasswordCommand,
   void
> {
   constructor(
      private readonly usersRepository: UsersRepository,
      private readonly bcryptService: BcryptService,
   ) {}

   async execute({ dto }: SetNewPasswordCommand): Promise<void> {
      const user = await this.usersRepository.findByPasswordRecoveryCode(
         dto.recoveryCode,
      );

      if (!user || !user.isPasswordRecoveryCodeValid(dto.recoveryCode)) {
         throw new DomainException({
            code: DomainExceptionCode.BadRequest,
            message: 'Recovery code is incorrect or expired',
            extensions: [
               {
                  field: 'recoveryCode',
                  message: 'Recovery code is incorrect or expired',
               },
            ],
         });
      }

      const passwordHash = await this.bcryptService.generateHash(
         dto.newPassword,
      );

      user.setNewPasswordHash(passwordHash);

      await this.usersRepository.save(user);
   }
}
