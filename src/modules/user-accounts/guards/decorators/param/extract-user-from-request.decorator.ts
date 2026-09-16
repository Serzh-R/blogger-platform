import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserContextDto } from '../../dto/user-context.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

type RequestWithUser = Request & {
   user?: UserContextDto;
};

export const ExtractUserFromRequest = createParamDecorator(
   (_data: unknown, context: ExecutionContext): UserContextDto => {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest<RequestWithUser>();

      const user = request.user;

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.InternalServerError,
            message: 'Authenticated user is missing from request',
         });
      }

      return user;
   },
);
