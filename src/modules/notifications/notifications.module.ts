import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { CoreConfig } from '../../core/core.config';
import type { SendMailOptions, TransportOptions } from 'nodemailer';

@Module({
   imports: [
      MailerModule.forRootAsync({
         imports: [],
         useFactory: (coreConfig: CoreConfig) => {
            const defaults: SendMailOptions & TransportOptions = {
               from: `"Blogger Platform" <${coreConfig.smtpFrom}>`,
            };

            return {
               transport: {
                  host: coreConfig.smtpHost,
                  port: coreConfig.smtpPort,
                  secure: coreConfig.smtpSecure,
                  auth: {
                     user: coreConfig.smtpUser,
                     pass: coreConfig.smtpPassword,
                  },
               },
               defaults,
            };
         },
         inject: [CoreConfig],
      }),
   ],
   providers: [EmailService],
   exports: [EmailService],
})
export class NotificationsModule {}
