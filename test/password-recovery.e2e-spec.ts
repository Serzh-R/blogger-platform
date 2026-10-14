import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { EmailService } from '../src/modules/notifications/email.service';
import type { NewPasswordInputDto } from '../src/modules/user-accounts/api/input-dto/new-password.input-dto';
import type { PasswordRecoveryInputDto } from '../src/modules/user-accounts/api/input-dto/password-recovery.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import { createUserTestData } from './helpers/user-test-data';

describe('Password recovery (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   // Сохраняем данные, переданные на отправку письма восстановления.
   const passwordRecoveryEmailCalls: {
      email: string;
      recoveryCode: string;
   }[] = [];

   beforeAll(async () => {
      const settings = await initSettings((moduleBuilder) => {
         moduleBuilder.overrideGuard(ThrottlerGuard).useValue({
            canActivate: () => true,
         });

         // Перехватываем email и настоящий код вместо отправки письма.
         moduleBuilder.overrideProvider(EmailService).useValue({
            sendPasswordRecoveryEmail: async (
               email: string,
               recoveryCode: string,
            ): Promise<void> => {
               passwordRecoveryEmailCalls.push({
                  email,
                  recoveryCode,
               });
            },
         });
      });

      app = settings.app;
      usersTestManager = settings.usersTestManager;
   });

   beforeEach(async () => {
      await deleteAllData(app);
      passwordRecoveryEmailCalls.length = 0;
   });

   describe('Password recovery flow', () => {
      it('sets a new password and rejects the old password and code reuse', async () => {
         const userInput = createUserTestData({
            password: 'OldPass123',
         });

         await usersTestManager.createUser(userInput);

         const recoveryRequestInput: PasswordRecoveryInputDto = {
            email: userInput.email,
         };

         // Пользователь запрашивает восстановление пароля.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
            .send(recoveryRequestInput)
            .expect(204);

         // Проверяем вызов отправки письма на его адрес.
         expect(passwordRecoveryEmailCalls).toEqual([
            {
               email: userInput.email,
               recoveryCode: expect.any(String),
            },
         ]);

         const recoveryCodeFromEmail =
            passwordRecoveryEmailCalls[0].recoveryCode;

         const newPasswordInput: NewPasswordInputDto = {
            newPassword: 'NewPass456',
            recoveryCode: recoveryCodeFromEmail,
         };

         // Пользователь задаёт новый пароль с кодом из письма.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/new-password`)
            .send(newPasswordInput)
            .expect(204);

         // Уже использованный код больше не позволяет сменить пароль.
         const repeatedPasswordChangeResponse = await request(
            app.getHttpServer(),
         )
            .post(`/${GLOBAL_PREFIX}/auth/new-password`)
            .send(newPasswordInput)
            .expect(400);

         expect(repeatedPasswordChangeResponse.body).toEqual({
            errorsMessages: [
               {
                  field: 'recoveryCode',
                  message: expect.any(String),
               },
            ],
         });

         // Старый пароль больше не подходит для входа.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(401);

         // Новый пароль позволяет войти и получить access токен.
         const loginWithNewPasswordResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: newPasswordInput.newPassword,
            })
            .expect(200);

         expect(loginWithNewPasswordResponse.body).toEqual({
            accessToken: expect.any(String),
         });
      });
   });

   describe('POST /api/auth/password-recovery', () => {
      it('returns 204 for an unregistered email without sending a recovery email', async () => {
         const recoveryRequestInput: PasswordRecoveryInputDto = {
            email: 'unregistered@example.com',
         };

         // В базе нет пользователя с этим email.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
            .send(recoveryRequestInput)
            .expect(204);

         // Отправка письма восстановления не должна вызываться.
         expect(passwordRecoveryEmailCalls).toEqual([]);
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
