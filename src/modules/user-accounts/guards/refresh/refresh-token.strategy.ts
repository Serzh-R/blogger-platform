import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { DeviceSessionsRepository } from '../../infrastructure/device-sessions.repository';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
   Strategy,
   'jwt-refresh-token',
) {
   constructor(
      private readonly deviceSessionsRepository: DeviceSessionsRepository,
      private readonly usersRepository: UsersRepository,
      userAccountsConfig: UserAccountsConfig,
   ) {
      super({
         jwtFromRequest: ExtractJwt.fromExtractors([
            (request: Request): string | null => {
               const refreshToken: unknown = request.cookies?.refreshToken;

               return typeof refreshToken === 'string' ? refreshToken : null;
            },
         ]),
         ignoreExpiration: false,
         secretOrKey: userAccountsConfig.refreshTokenSecret,
      });
   }

   async validate(
      payload: unknown,
   ): Promise<{ userId: string; deviceId: string } | null> {
      if (
         typeof payload !== 'object' ||
         payload === null ||
         !('userId' in payload) ||
         typeof payload.userId !== 'string' ||
         !('deviceId' in payload) ||
         typeof payload.deviceId !== 'string' ||
         !('iat' in payload) ||
         typeof payload.iat !== 'number' ||
         !('exp' in payload) ||
         typeof payload.exp !== 'number'
      ) {
         return null;
      }

      const session = await this.deviceSessionsRepository.findByDeviceId(
         payload.deviceId,
      );

      if (!session) {
         return null;
      }

      if (session.userId !== payload.userId) {
         return null;
      }

      if (session.lastActiveDate.getTime() !== payload.iat * 1000) {
         return null;
      }

      const user = await this.usersRepository.findById(payload.userId);

      if (!user) {
         return null;
      }

      return {
         userId: payload.userId,
         deviceId: payload.deviceId,
      };
   }
}
