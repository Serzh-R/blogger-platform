import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { CreateUserInputDto } from '../../api/input-dto/create-user.input-dto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { EmailService } from '../../../notifications/email.service';
import { UsersFactory } from '../factories/users.factory';

export class RegisterUserCommand {
   constructor(public readonly dto: CreateUserInputDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase implements ICommandHandler<
   RegisterUserCommand,
   void
> {
   constructor(
      private readonly usersFactory: UsersFactory,
      private readonly usersRepository: UsersRepository,
      private readonly emailService: EmailService,
   ) {}

   async execute({ dto }: RegisterUserCommand): Promise<void> {
      const user = await this.usersFactory.create(dto);

      const confirmationCode = randomUUID();
      const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      user.setConfirmationCode(confirmationCode, expirationDate);

      await this.usersRepository.save(user);

      void this.emailService
         .sendConfirmationEmail(user.email, confirmationCode)
         .catch((error: unknown) => {
            console.error('Confirmation email sending failed', error);
         });
   }
}
