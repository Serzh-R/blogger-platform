import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class DeleteUserCommand {
   constructor(public readonly userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<
   DeleteUserCommand,
   void
> {
   constructor(private readonly usersRepository: UsersRepository) {}

   async execute({ userId }: DeleteUserCommand): Promise<void> {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'User not found',
         });
      }

      user.makeDeleted();

      await this.usersRepository.save(user);
   }
}
