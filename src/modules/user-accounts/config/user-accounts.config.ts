import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';
import { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class UserAccountsConfig {
   @IsNotEmpty({ message: 'Задайте ACCESS_TOKEN_EXPIRE_IN' })
   accessTokenExpireIn: NonNullable<JwtSignOptions['expiresIn']>;

   @IsNotEmpty({ message: 'Задайте REFRESH_TOKEN_EXPIRE_IN' })
   refreshTokenExpireIn: NonNullable<JwtSignOptions['expiresIn']>;

   @IsNotEmpty({ message: 'Задайте REFRESH_TOKEN_SECRET' })
   refreshTokenSecret: string;

   @IsNotEmpty({ message: 'Задайте ACCESS_TOKEN_SECRET' })
   accessTokenSecret: string;

   constructor(private configService: ConfigService<any, true>) {
      this.accessTokenExpireIn = this.configService.get(
         'ACCESS_TOKEN_EXPIRE_IN',
      );
      this.refreshTokenExpireIn = this.configService.get(
         'REFRESH_TOKEN_EXPIRE_IN',
      );
      this.refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
      this.accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');

      configValidationUtility.validateConfig(this);
   }
}
