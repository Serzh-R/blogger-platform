import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { DeviceSessionsRepository } from '../../infrastructure/device-sessions.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class RefreshTokenCommand {
   constructor(
      public readonly userId: string,
      public readonly deviceId: string,
   ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase implements ICommandHandler<
   RefreshTokenCommand,
   { accessToken: string; refreshToken: string }
> {
   constructor(
      private readonly jwtService: JwtService,
      private readonly userAccountsConfig: UserAccountsConfig,
      private readonly deviceSessionsRepository: DeviceSessionsRepository,
   ) {}

   async execute({ userId, deviceId }: RefreshTokenCommand): Promise<{
      accessToken: string;
      refreshToken: string;
   }> {
      const session =
         await this.deviceSessionsRepository.findByDeviceId(deviceId);

      if (!session || session.userId !== userId) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Unauthorized',
         });
      }

      const accessToken = await this.jwtService.signAsync(
         { userId },
         {
            secret: this.userAccountsConfig.accessTokenSecret,
            expiresIn: this.userAccountsConfig.accessTokenExpireIn,
         },
      );

      const refreshToken = await this.jwtService.signAsync(
         { userId, deviceId },
         {
            secret: this.userAccountsConfig.refreshTokenSecret,
            expiresIn: this.userAccountsConfig.refreshTokenExpireIn,
         },
      );

      const refreshPayload = await this.jwtService.verifyAsync<{
         iat: number;
         exp: number;
      }>(refreshToken, {
         secret: this.userAccountsConfig.refreshTokenSecret,
      });

      session.updateDates(
         new Date(refreshPayload.iat * 1000),
         new Date(refreshPayload.exp * 1000),
      );

      await this.deviceSessionsRepository.save(session);

      return { accessToken, refreshToken };
   }
}
