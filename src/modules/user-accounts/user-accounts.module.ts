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
import { SETTINGS } from '../../core/settings';
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
      ]),
      JwtModule.register({
         secret: SETTINGS.JWT_ACCESS_SECRET,
         signOptions: {
            expiresIn: '5m',
         },
      }),
      NotificationsModule,
   ],
   controllers: [UsersController, AuthController],
   providers: [
      UsersRepository,
      UsersQueryRepository,
      UsersFactory,
      BcryptService,
      AuthService,
      LocalStrategy,
      JwtStrategy,
      AuthQueryRepository,

      CreateUserUseCase,
      DeleteUserUseCase,
      RegisterUserUseCase,
      ConfirmRegistrationUseCase,
      ResendRegistrationEmailUseCase,
      PasswordRecoveryUseCase,
      SetNewPasswordUseCase,
   ],

   exports: [UsersRepository],
})
export class UserAccountsModule {}
