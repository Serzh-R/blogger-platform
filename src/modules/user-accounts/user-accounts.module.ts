import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { BcryptService } from './application/bcrypt.service';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthService } from './application/auth.service';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './api/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { DeleteUserUseCase } from './application/usecases/delete-user.usecase';
import { CreateUserUseCase } from './application/usecases/create-user.usecase';
import { RegisterUserUseCase } from './application/usecases/register-user.usecase';
import { UsersFactory } from './application/factories/users.factory';
import { ConfirmRegistrationUseCase } from './application/usecases/confirm-registration.usecase';
import { ResendRegistrationEmailUseCase } from './application/usecases/resend-registration-email.usecase';
import { PasswordRecoveryUseCase } from './application/usecases/password-recovery.usecase';
import { SetNewPasswordUseCase } from './application/usecases/set-new-password.usecase';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import { UserAccountsConfig } from './config/user-accounts.config';
import {
   DeviceSession,
   DeviceSessionSchema,
} from './domain/device-session.entity';
import { DeviceSessionsRepository } from './infrastructure/device-sessions.repository';

@Module({
   imports: [
      PassportModule.register({
         session: false,
      }),
      MongooseModule.forFeature([
         {
            name: User.name,
            schema: UserSchema,
         },
         {
            name: DeviceSession.name,
            schema: DeviceSessionSchema,
         },
      ]),
      JwtModule.register({}),
      NotificationsModule,
   ],
   controllers: [UsersController, AuthController],
   providers: [
      UserAccountsConfig,
      UsersRepository,
      UsersQueryRepository,
      UsersFactory,
      BcryptService,
      AuthService,
      LocalStrategy,
      JwtStrategy,
      AuthQueryRepository,
      DeviceSessionsRepository,

      CreateUserUseCase,
      DeleteUserUseCase,
      RegisterUserUseCase,
      ConfirmRegistrationUseCase,
      ResendRegistrationEmailUseCase,
      PasswordRecoveryUseCase,
      SetNewPasswordUseCase,
      LoginUserUseCase,
   ],

   exports: [UsersRepository],
})
export class UserAccountsModule {}
