import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class ConfirmRegistrationCommand {
   constructor(public readonly confirmationCode: string) {}
}

@CommandHandler(ConfirmRegistrationCommand)
export class ConfirmRegistrationUseCase implements ICommandHandler<
   ConfirmRegistrationCommand,
   void
> {
   constructor(private readonly usersRepository: UsersRepository) {}

   async execute({
      confirmationCode,
   }: ConfirmRegistrationCommand): Promise<void> {
      const user =
         await this.usersRepository.findByConfirmationCode(confirmationCode);

      if (!user || !user.confirmEmail(confirmationCode)) {
         throw new DomainException({
            code: DomainExceptionCode.BadRequest,
            message: 'Registration confirmation failed',
            extensions: [
               {
                  field: 'code',
                  message:
                     'Confirmation code is incorrect, expired or already applied',
               },
            ],
         });
      }

      await this.usersRepository.save(user);
   }
}
