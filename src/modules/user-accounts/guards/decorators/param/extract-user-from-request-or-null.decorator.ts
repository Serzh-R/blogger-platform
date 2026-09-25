import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserContextDto } from '../../dto/user-context.dto';

type RequestWithOptionalUser = Request & {
   user?: UserContextDto | null;
};

export const ExtractUserFromRequestOrNull = createParamDecorator(
   (_data: unknown, context: ExecutionContext): UserContextDto | null => {
      const ctx = context.switchToHttp();

      const request = ctx.getRequest<RequestWithOptionalUser>();

      return request.user ?? null;
   },
);
