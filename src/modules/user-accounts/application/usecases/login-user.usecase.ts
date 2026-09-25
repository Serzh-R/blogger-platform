import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { SETTINGS } from '../../../../core/settings';
import type { UserContextDto } from '../../guards/dto/user-context.dto';

export class LoginUserCommand {
   constructor(public readonly userId: string) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
   LoginUserCommand,
   { accessToken: string; refreshToken: string }
> {
   constructor(private readonly jwtService: JwtService) {}

   async execute({ userId }: LoginUserCommand): Promise<{
      accessToken: string;
      refreshToken: string;
   }> {
      const payload: UserContextDto = { id: userId };

      const accessToken = await this.jwtService.signAsync(payload);

      const refreshToken = await this.jwtService.signAsync(
         { id: userId, tokenType: 'refresh' },
         {
            secret: `${SETTINGS.JWT_ACCESS_SECRET}:refresh`,
            expiresIn: '7d',
         },
      );

      return { accessToken, refreshToken };
   }
}
