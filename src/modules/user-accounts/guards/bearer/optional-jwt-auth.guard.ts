import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
   handleRequest<TUser = any>(
      _err: unknown,
      user: TUser | false | null | undefined,
   ): TUser {
      return (user || null) as TUser;
   }
}
