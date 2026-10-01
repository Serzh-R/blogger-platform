import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { configValidationUtility } from '../setup/config-validation.utility';

@Injectable()
export class CoreConfig {
   @IsNotEmpty({ message: 'MONGO_URL is not defined' })
   mongoUrl: string;

   @IsNotEmpty({ message: 'DB_NAME is not defined' })
   dbName: string;

   @IsNotEmpty({ message: 'SMTP_HOST is not defined' })
   smtpHost: string;

   @IsInt({ message: 'SMTP_PORT must be a valid port number' })
   @Min(1, { message: 'SMTP_PORT must be a valid port number' })
   smtpPort: number;

   @IsNotEmpty({ message: 'SMTP_USER is not defined' })
   smtpUser: string;

   @IsNotEmpty({ message: 'SMTP_PASSWORD is not defined' })
   smtpPassword: string;

   smtpSecure: boolean;

   smtpFrom: string;

   constructor(private configService: ConfigService<any, true>) {
      this.mongoUrl = this.configService.get('MONGO_URL');
      this.dbName =
         this.configService.get('DB_NAME') || 'blogger_platform_local';

      this.smtpHost = this.configService.get('SMTP_HOST');
      this.smtpPort = Number(this.configService.get('SMTP_PORT'));
      this.smtpUser = this.configService.get('SMTP_USER');
      this.smtpPassword = this.configService.get('SMTP_PASSWORD');
      this.smtpSecure = this.configService.get('SMTP_SECURE') === 'true';
      this.smtpFrom = this.configService.get('SMTP_FROM') || this.smtpUser;

      configValidationUtility.validateConfig(this);
   }
}
