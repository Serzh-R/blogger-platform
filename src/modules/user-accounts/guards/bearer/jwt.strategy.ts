import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { UserContextDto } from '../dto/user-context.dto';
import { UserAccountsConfig } from '../../config/user-accounts.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
   constructor(userAccountsConfig: UserAccountsConfig) {
      super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         secretOrKey: userAccountsConfig.accessTokenSecret,
      });
   }

   validate(payload: UserContextDto): UserContextDto {
      return {
         userId: payload.userId,
      };
   }
}
