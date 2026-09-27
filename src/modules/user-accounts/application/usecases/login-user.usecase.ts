import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import type { UserContextDto } from '../../guards/dto/user-context.dto';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceSession } from '../../domain/device-session.entity';
import type { DeviceSessionModelType } from '../../domain/device-session.entity';
import { DeviceSessionsRepository } from '../../infrastructure/device-sessions.repository';
import { randomUUID } from 'node:crypto';

export class LoginUserCommand {
   constructor(
      public readonly userId: string,
      public readonly ip: string,
      public readonly title: string,
   ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
   LoginUserCommand,
   { accessToken: string; refreshToken: string }
> {
   constructor(
      private readonly jwtService: JwtService,
      private readonly userAccountsConfig: UserAccountsConfig,
      @InjectModel(DeviceSession.name)
      private readonly DeviceSessionModel: DeviceSessionModelType,
      private readonly deviceSessionsRepository: DeviceSessionsRepository,
   ) {}

   async execute({ userId, ip, title }: LoginUserCommand): Promise<{
      accessToken: string;
      refreshToken: string;
   }> {
      const deviceId = randomUUID();
      const payload: UserContextDto = { userId };

      const accessToken = await this.jwtService.signAsync(payload, {
         secret: this.userAccountsConfig.accessTokenSecret,
         expiresIn: this.userAccountsConfig.accessTokenExpireIn,
      });

      const refreshToken = await this.jwtService.signAsync(
         { userId, deviceId },
         {
            secret: this.userAccountsConfig.refreshTokenSecret,
            expiresIn: this.userAccountsConfig.refreshTokenExpireIn,
         },
      );

      const refreshPayload = await this.jwtService.verifyAsync<{
         userId: string;
         deviceId: string;
         iat: number;
         exp: number;
      }>(refreshToken, {
         secret: this.userAccountsConfig.refreshTokenSecret,
      });

      const session = this.DeviceSessionModel.createInstance({
         userId,
         deviceId,
         ip,
         title,
         lastActiveDate: new Date(refreshPayload.iat * 1000),
         expirationDate: new Date(refreshPayload.exp * 1000),
      });

      await this.deviceSessionsRepository.save(session);

      return { accessToken, refreshToken };
   }
}
