import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { EmailService } from '../../../notifications/email.service';

export class PasswordRecoveryCommand {
   constructor(public readonly email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<
   PasswordRecoveryCommand,
   void
> {
   constructor(
      private readonly usersRepository: UsersRepository,
      private readonly emailService: EmailService,
   ) {}

   async execute({ email }: PasswordRecoveryCommand): Promise<void> {
      const user = await this.usersRepository.findByEmail(email);

      if (!user) {
         return;
      }

      const recoveryCode = randomUUID();

      const expirationDate = new Date(Date.now() + 60 * 60 * 1000);

      user.setPasswordRecoveryCode(recoveryCode, expirationDate);

      await this.usersRepository.save(user);

      void this.emailService
         .sendPasswordRecoveryEmail(user.email, recoveryCode)
         .catch((error: unknown) => {
            console.error('Password recovery email sending failed', error);
         });
   }
}
