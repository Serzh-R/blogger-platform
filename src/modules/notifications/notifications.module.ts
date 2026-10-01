import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { CoreConfig } from '../../core/core.config';

@Module({
   imports: [
      MailerModule.forRootAsync({
         imports: [],
         useFactory: (coreConfig: CoreConfig) => ({
            transport: {
               host: coreConfig.smtpHost,
               port: coreConfig.smtpPort,
               secure: coreConfig.smtpSecure,
               auth: {
                  user: coreConfig.smtpUser,
                  pass: coreConfig.smtpPassword,
               },
            },
            defaults: {
               from: `"Blogger Platform" <${coreConfig.smtpFrom}>`,
            },
         }),
         inject: [CoreConfig],
      }),
   ],
   providers: [EmailService],
   exports: [EmailService],
})
export class NotificationsModule {}
