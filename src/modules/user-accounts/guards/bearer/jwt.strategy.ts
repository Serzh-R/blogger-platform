import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SETTINGS } from '../../../../core/settings';
import type { UserContextDto } from '../dto/user-context.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
   constructor() {
      super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         secretOrKey: SETTINGS.JWT_ACCESS_SECRET,
      });
   }

   validate(payload: UserContextDto): UserContextDto {
      return {
         id: payload.id,
      };
   }
}
