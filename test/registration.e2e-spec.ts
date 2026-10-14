import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { EmailService } from '../src/modules/notifications/email.service';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import type { RegistrationConfirmationInputDto } from '../src/modules/user-accounts/api/input-dto/registration-confirmation.input-dto';
import type { RegistrationEmailResendingInputDto } from '../src/modules/user-accounts/api/input-dto/registration-email-resending.input-dto';
import { createUserTestData } from './helpers/user-test-data';

describe('Registration (e2e)', () => {
   let app: INestApplication;

   // Здесь сохраняем данные, переданные на отправку письма.
   const confirmationEmailCalls: {
      email: string;
      confirmationCode: string;
   }[] = [];

   beforeAll(async () => {
      const settings = await initSettings((moduleBuilder) => {
         moduleBuilder.overrideGuard(ThrottlerGuard).useValue({
            canActivate: () => true,
         });

         // Вместо отправки настоящего письма записываем email и код.
         moduleBuilder.overrideProvider(EmailService).useValue({
            sendConfirmationEmail: async (
               email: string,
               confirmationCode: string,
            ): Promise<void> => {
               confirmationEmailCalls.push({
                  email,
                  confirmationCode,
               });
            },
         });
      });

      app = settings.app;
   });

   beforeEach(async () => {
      await deleteAllData(app);

      // Очищаем сведения о письмах перед каждым тестом.
      confirmationEmailCalls.length = 0;
   });

   describe('POST /api/auth/registration', () => {
      it('registers a user and requests a confirmation email', async () => {
         const userInput = createUserTestData();

         // Регистрируем пользователя без авторизации администратора.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration`)
            .send(userInput)
            .expect(204);

         // Проверяем, что пользователь появился в базе.
         const getUsersResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         expect(getUsersResponse.body.totalCount).toBe(1);
         expect(getUsersResponse.body.items).toEqual([
            {
               id: expect.any(String),
               login: userInput.login,
               email: userInput.email,
               createdAt: expect.any(String),
            },
         ]);

         // Проверяем один вызов отправки письма с нужным email и кодом.
         expect(confirmationEmailCalls).toEqual([
            {
               email: userInput.email,
               confirmationCode: expect.any(String),
            },
         ]);
      });
   });

   describe('POST /api/auth/registration-confirmation', () => {
      it('confirms registration and rejects reuse of the confirmation code', async () => {
         const userInput = createUserTestData();

         // Регистрируем пользователя: приложение создаёт и сохраняет код.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration`)
            .send(userInput)
            .expect(204);

         // Проверяем, что приложение вызвало отправку одного письма.
         expect(confirmationEmailCalls).toHaveLength(1);

         // Берём настоящий код из данных, переданных сервису отправки.
         const confirmationCode = confirmationEmailCalls[0].confirmationCode;

         const confirmationInput: RegistrationConfirmationInputDto = {
            code: confirmationCode,
         };

         // Пользователь подтверждает регистрацию кодом из письма.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
            .send(confirmationInput)
            .expect(204);

         // Повторно открывает ту же ссылку подтверждения.
         const repeatedConfirmationResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
            .send(confirmationInput)
            .expect(400);

         // Уже применённый код не должен подтверждать регистрацию повторно.
         expect(repeatedConfirmationResponse.body).toEqual({
            errorsMessages: [
               {
                  field: 'code',
                  message: expect.any(String),
               },
            ],
         });
      });
   });

   describe('POST /api/auth/registration-email-resending', () => {
      it('sends a new confirmation code and invalidates the previous code', async () => {
         const userInput = createUserTestData();

         // Регистрируем пользователя и получаем первое письмо.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration`)
            .send(userInput)
            .expect(204);

         expect(confirmationEmailCalls).toHaveLength(1);

         const originalConfirmationCode =
            confirmationEmailCalls[0].confirmationCode;

         const resendEmailInput: RegistrationEmailResendingInputDto = {
            email: userInput.email,
         };

         // Пользователь запрашивает повторную отправку письма.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
            .send(resendEmailInput)
            .expect(204);

         // Должен появиться второй вызов отправки на тот же адрес.
         expect(confirmationEmailCalls).toHaveLength(2);
         expect(confirmationEmailCalls[1].email).toBe(userInput.email);

         const newConfirmationCode = confirmationEmailCalls[1].confirmationCode;

         // Во втором письме должен быть новый код.
         expect(newConfirmationCode).not.toBe(originalConfirmationCode);

         // Ссылка из первого письма больше не подтверждает регистрацию.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
            .send({ code: originalConfirmationCode })
            .expect(400);

         // Ссылка из повторного письма успешно подтверждает регистрацию.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
            .send({ code: newConfirmationCode })
            .expect(204);
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
