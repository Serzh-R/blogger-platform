import {
   Body,
   Controller,
   Get,
   HttpCode,
   HttpStatus,
   Post,
   Res,
   UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import type { UserContextDto } from '../guards/dto/user-context.dto';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { MeViewDto } from './view-dto/me.view-dto';
import { CreateUserInputDto } from './input-dto/create-user.input-dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../application/usecases/register-user.usecase';
import { ConfirmRegistrationCommand } from '../application/usecases/confirm-registration.usecase';
import { ResendRegistrationEmailCommand } from '../application/usecases/resend-registration-email.usecase';
import { PasswordRecoveryCommand } from '../application/usecases/password-recovery.usecase';
import { SetNewPasswordCommand } from '../application/usecases/set-new-password.usecase';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';

@Controller('auth')
export class AuthController {
   constructor(
      private readonly commandBus: CommandBus,
      private readonly authQueryRepository: AuthQueryRepository,
   ) {}

   @Post('registration')
   @HttpCode(HttpStatus.NO_CONTENT)
   async registration(@Body() body: CreateUserInputDto): Promise<void> {
      await this.commandBus.execute<RegisterUserCommand, void>(
         new RegisterUserCommand(body),
      );
   }

   @Post('registration-confirmation')
   @HttpCode(HttpStatus.NO_CONTENT)
   async registrationConfirmation(
      @Body() body: RegistrationConfirmationInputDto,
   ): Promise<void> {
      await this.commandBus.execute<ConfirmRegistrationCommand, void>(
         new ConfirmRegistrationCommand(body.code),
      );
   }

   @Post('registration-email-resending')
   @HttpCode(HttpStatus.NO_CONTENT)
   async registrationEmailResending(
      @Body() body: RegistrationEmailResendingInputDto,
   ): Promise<void> {
      await this.commandBus.execute<ResendRegistrationEmailCommand, void>(
         new ResendRegistrationEmailCommand(body.email),
      );
   }

   @Post('new-password')
   @HttpCode(HttpStatus.NO_CONTENT)
   async setNewPassword(@Body() dto: NewPasswordInputDto): Promise<void> {
      await this.commandBus.execute<SetNewPasswordCommand, void>(
         new SetNewPasswordCommand(dto),
      );
   }

   @Post('password-recovery')
   @HttpCode(HttpStatus.NO_CONTENT)
   async passwordRecovery(
      @Body() dto: PasswordRecoveryInputDto,
   ): Promise<void> {
      await this.commandBus.execute<PasswordRecoveryCommand, void>(
         new PasswordRecoveryCommand(dto.email),
      );
   }

   @Post('login')
   @HttpCode(HttpStatus.OK)
   @UseGuards(LocalAuthGuard)
   async login(
      @ExtractUserFromRequest() user: UserContextDto,
      @Res({ passthrough: true }) response: Response,
   ): Promise<{ accessToken: string }> {
      const { accessToken, refreshToken } = await this.commandBus.execute<
         LoginUserCommand,
         { accessToken: string; refreshToken: string }
      >(new LoginUserCommand(user.id));

      response.cookie('refreshToken', refreshToken, {
         httpOnly: true,
         secure: true,
         sameSite: 'lax',
      });

      return { accessToken };
   }

   @Get('me')
   @UseGuards(JwtAuthGuard)
   me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
      return this.authQueryRepository.me(user.id);
   }
}
