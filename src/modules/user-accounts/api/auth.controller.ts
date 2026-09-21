import {
   Body,
   Controller,
   Get,
   HttpCode,
   HttpStatus,
   Post,
   UseGuards,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import type { UserContextDto } from '../guards/dto/user-context.dto';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { MeViewDto } from './view-dto/me.view-dto';
import { UsersService } from '../application/users.service';
import { CreateUserInputDto } from './input-dto/create-user.input-dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';

@Controller('auth')
export class AuthController {
   constructor(
      private readonly usersService: UsersService,
      private readonly authService: AuthService,
      private readonly authQueryRepository: AuthQueryRepository,
   ) {}

   @Post('registration')
   @HttpCode(HttpStatus.NO_CONTENT)
   async registration(@Body() body: CreateUserInputDto): Promise<void> {
      await this.usersService.registerUser(body);
   }

   @Post('registration-confirmation')
   @HttpCode(HttpStatus.NO_CONTENT)
   async registrationConfirmation(
      @Body() body: RegistrationConfirmationInputDto,
   ): Promise<void> {
      await this.usersService.confirmRegistration(body.code);
   }

   @Post('registration-email-resending')
   @HttpCode(HttpStatus.NO_CONTENT)
   async registrationEmailResending(
      @Body() body: RegistrationEmailResendingInputDto,
   ): Promise<void> {
      await this.usersService.resendRegistrationEmail(body.email);
   }

   @Post('new-password')
   @HttpCode(HttpStatus.NO_CONTENT)
   async setNewPassword(@Body() dto: NewPasswordInputDto): Promise<void> {
      await this.usersService.setNewPassword(dto);
   }

   @Post('password-recovery')
   @HttpCode(HttpStatus.NO_CONTENT)
   async passwordRecovery(
      @Body() dto: PasswordRecoveryInputDto,
   ): Promise<void> {
      await this.usersService.requestPasswordRecovery(dto.email);
   }

   @Post('login')
   @HttpCode(HttpStatus.OK)
   @UseGuards(LocalAuthGuard)
   login(
      @ExtractUserFromRequest() user: UserContextDto,
   ): Promise<{ accessToken: string }> {
      return this.authService.login(user.id);
   }

   @Get('me')
   @UseGuards(JwtAuthGuard)
   me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
      return this.authQueryRepository.me(user.id);
   }
}
