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
