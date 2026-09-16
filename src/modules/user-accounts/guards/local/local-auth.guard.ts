import { ExecutionContext, Injectable, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { LoginInputDto } from '../../api/input-dto/login.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { errorFormatter } from '../../../../setup/pipes.setup';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
   private readonly loginValidationPipe = new ValidationPipe({
      transform: true,
      stopAtFirstError: true,

      exceptionFactory: (errors) => {
         return new DomainException({
            code: DomainExceptionCode.ValidationError,
            message: 'Validation failed',
            extensions: errorFormatter(errors),
         });
      },
   });

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest<Request>();

      const validatedBody = await this.loginValidationPipe.transform(
         request.body,
         {
            type: 'body',
            metatype: LoginInputDto,
         },
      );

      request.body = validatedBody;

      return super.canActivate(context) as Promise<boolean>;
   }
}
