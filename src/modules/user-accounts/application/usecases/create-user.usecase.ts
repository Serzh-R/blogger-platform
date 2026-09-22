import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserInputDto } from '../../api/input-dto/create-user.input-dto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UsersFactory } from '../factories/users.factory';

export class CreateUserCommand {
   constructor(public readonly dto: CreateUserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<
   CreateUserCommand,
   string
> {
   constructor(
      private readonly usersFactory: UsersFactory,
      private readonly usersRepository: UsersRepository,
   ) {}

   async execute({ dto }: CreateUserCommand): Promise<string> {
      const user = await this.usersFactory.create(dto);

      await this.usersRepository.save(user);

      return user._id.toString();
   }
}
