import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
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
      UsersService,
      UsersRepository,
      UsersQueryRepository,
      BcryptService,
      AuthService,
      LocalStrategy,
      JwtStrategy,
      AuthQueryRepository,
   ],

   exports: [UsersRepository],
})
export class UserAccountsModule {}
