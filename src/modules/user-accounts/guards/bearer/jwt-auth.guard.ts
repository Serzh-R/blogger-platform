import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
   handleRequest<TUser = any>(
      err: unknown,
      user: TUser | false | null | undefined,
   ): TUser {
      if (err) {
         throw err;
      }

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Unauthorized',
         });
      }

      return user;
   }
}
