import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
   constructor(private readonly mailerService: MailerService) {}

   async sendConfirmationEmail(
      email: string,
      confirmationCode: string,
   ): Promise<void> {
      const confirmationUrl =
         `https://some-front.com/confirm-registration` +
         `?code=${encodeURIComponent(confirmationCode)}`;

      await this.mailerService.sendMail({
         to: email,
         subject: 'Registration confirmation',
         html: `
            <h1>Thank you for registration</h1>
            <p>
               To finish registration, follow the link:
               <a href="${confirmationUrl}">
                  complete registration
               </a>
            </p>
         `,
      });
   }
}
