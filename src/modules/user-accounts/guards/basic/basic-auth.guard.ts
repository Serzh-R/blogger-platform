import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BasicAuthGuard implements CanActivate {
   private readonly validUsername = 'admin';
   private readonly validPassword = 'qwerty';

   canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();

      const authorization = request.headers.authorization;

      if (!authorization || !authorization.startsWith('Basic ')) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Unauthorized',
         });
      }

      const encodedCredentials = authorization.slice('Basic '.length);

      const expectedCredentials = Buffer.from(
         `${this.validUsername}:${this.validPassword}`,
         'utf8',
      ).toString('base64');

      if (encodedCredentials !== expectedCredentials) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Unauthorized',
         });
      }

      return true;
   }
}
