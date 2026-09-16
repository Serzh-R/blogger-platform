import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../application/auth.service';
import type { UserContextDto } from '../dto/user-context.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
   constructor(private readonly authService: AuthService) {
      super({
         usernameField: 'loginOrEmail',
      });
   }

   async validate(
      loginOrEmail: string,
      password: string,
   ): Promise<UserContextDto> {
      const user = await this.authService.validateUser(loginOrEmail, password);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Invalid login, email or password',
         });
      }

      return user;
   }
}
