import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { EmailService } from '../../../notifications/email.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class ResendRegistrationEmailCommand {
   constructor(public readonly email: string) {}
}

@CommandHandler(ResendRegistrationEmailCommand)
export class ResendRegistrationEmailUseCase implements ICommandHandler<
   ResendRegistrationEmailCommand,
   void
> {
   constructor(
      private readonly usersRepository: UsersRepository,
      private readonly emailService: EmailService,
   ) {}

   async execute({ email }: ResendRegistrationEmailCommand): Promise<void> {
      const user = await this.usersRepository.findByEmail(email);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.BadRequest,
            message: 'Registration email resending failed',
            extensions: [
               {
                  field: 'email',
                  message: 'User with this email does not exist',
               },
            ],
         });
      }

      const confirmationCode = randomUUID();

      const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const confirmationCodeWasSet = user.setConfirmationCode(
         confirmationCode,
         expirationDate,
      );

      if (!confirmationCodeWasSet) {
         throw new DomainException({
            code: DomainExceptionCode.BadRequest,
            message: 'Registration email resending failed',
            extensions: [
               {
                  field: 'email',
                  message: 'Email is already confirmed',
               },
            ],
         });
      }

      await this.usersRepository.save(user);

      void this.emailService
         .sendConfirmationEmail(user.email, confirmationCode)
         .catch((error: unknown) => {
            console.error('Confirmation email resending failed', error);
         });
   }
}
