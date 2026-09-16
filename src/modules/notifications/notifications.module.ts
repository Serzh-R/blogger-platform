import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { SETTINGS } from '../../core/settings';

@Module({
   imports: [
      MailerModule.forRoot({
         transport: {
            host: SETTINGS.SMTP.HOST,
            port: SETTINGS.SMTP.PORT,
            secure: SETTINGS.SMTP.SECURE,
            auth: {
               user: SETTINGS.SMTP.USER,
               pass: SETTINGS.SMTP.PASSWORD,
            },
         },
         defaults: {
            from: `"Blogger Platform" <${SETTINGS.SMTP.FROM}>`,
         },
      }),
   ],
   providers: [EmailService],
   exports: [EmailService],
})
export class NotificationsModule {}
