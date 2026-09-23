import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import type { UserContextDto } from '../../guards/dto/user-context.dto';

export class LoginUserCommand {
   constructor(public readonly userId: string) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
   LoginUserCommand,
   { accessToken: string }
> {
   constructor(private readonly jwtService: JwtService) {}

   async execute({
      userId,
   }: LoginUserCommand): Promise<{ accessToken: string }> {
      const payload: UserContextDto = {
         id: userId,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return {
         accessToken,
      };
   }
}
