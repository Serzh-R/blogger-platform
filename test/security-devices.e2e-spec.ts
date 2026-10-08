import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import type { DeviceSessionViewDto } from '../src/modules/user-accounts/api/view-dto/device-session.view-dto';

describe('Security devices (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
      // Настраиваем приложение без ограничения количества запросов.
      const result = await initSettings((moduleBuilder) => {
         moduleBuilder.overrideGuard(ThrottlerGuard).useValue({
            canActivate: () => true,
         });
      });

      app = result.app;
      usersTestManager = result.usersTestManager;
   });

   beforeEach(async () => {
      await deleteAllData(app);
   });

   describe('GET /api/security/devices', () => {
      it('returns the device session created during login', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const deviceTitle = 'Test browser';

         await usersTestManager.createUser(input);

         // Входим с заданным названием браузера.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', deviceTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Получаем refresh cookie.
         const loginCookies: unknown = loginResponse.headers['set-cookie'];

         if (!Array.isArray(loginCookies)) {
            throw new Error('Set-Cookie header must be an array');
         }

         const loginRefreshCookie = loginCookies.find((cookie: string) =>
            cookie.startsWith('refreshToken='),
         );

         if (typeof loginRefreshCookie !== 'string') {
            throw new Error('Refresh token cookie is missing');
         }

         const refreshTokenCookie = loginRefreshCookie.split(';')[0];

         // Запрашиваем список сессий с полученной cookie.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', refreshTokenCookie)
            .expect(200);

         // Проверяем одну сессию и точный состав её полей.
         expect(response.body).toEqual([
            {
               ip: expect.any(String),
               title: deviceTitle,
               lastActiveDate: expect.any(String),
               deviceId: expect.any(String),
            },
         ]);
      });

      it('returns both device sessions after login from two devices', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const computerTitle = 'Computer browser';
         const phoneTitle = 'Phone browser';

         await usersTestManager.createUser(input);

         // Входим с компьютера и получаем ответ с refresh cookie.
         const computerLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', computerTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Повторно входим под тем же пользователем, теперь с телефона.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', phoneTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Получаем массив cookie из ответа на вход с компьютера.
         const computerLoginCookies: unknown =
            computerLoginResponse.headers['set-cookie'];

         if (!Array.isArray(computerLoginCookies)) {
            throw new Error('Set-Cookie header must be an array');
         }

         // Находим полную строку refresh cookie вместе с атрибутами.
         const computerRefreshCookieWithAttributes = computerLoginCookies.find(
            (cookie: string) => cookie.startsWith('refreshToken='),
         );

         if (typeof computerRefreshCookieWithAttributes !== 'string') {
            throw new Error('Refresh token cookie is missing');
         }

         // Оставляем только refreshToken=значение для отправки в запросе.
         const computerRefreshTokenCookie =
            computerRefreshCookieWithAttributes.split(';')[0];

         // Запрашиваем список сессий, используя cookie компьютера.
         const devicesResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', computerRefreshTokenCookie)
            .expect(200);

         // Проверяем, что вернулись ровно две сессии.
         expect(devicesResponse.body).toHaveLength(2);

         // Обе сессии должны присутствовать независимо от порядка в массиве.
         expect(devicesResponse.body).toEqual(
            expect.arrayContaining([
               {
                  ip: expect.any(String),
                  title: computerTitle,
                  lastActiveDate: expect.any(String),
                  deviceId: expect.any(String),
               },
               {
                  ip: expect.any(String),
                  title: phoneTitle,
                  lastActiveDate: expect.any(String),
                  deviceId: expect.any(String),
               },
            ]),
         );
      });
   });

   describe('DELETE /api/security/devices', () => {
      it('terminates other device sessions and keeps the current session', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const computerTitle = 'Computer browser';
         const phoneTitle = 'Phone browser';

         await usersTestManager.createUser(input);

         const computerLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', computerTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         const phoneLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', phoneTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         const computerLoginCookies: unknown =
            computerLoginResponse.headers['set-cookie'];

         if (!Array.isArray(computerLoginCookies)) {
            throw new Error('Computer Set-Cookie header must be an array');
         }

         const computerRefreshCookieWithAttributes = computerLoginCookies.find(
            (cookie: string) => cookie.startsWith('refreshToken='),
         );

         if (typeof computerRefreshCookieWithAttributes !== 'string') {
            throw new Error('Computer refresh token cookie is missing');
         }

         const computerRefreshTokenCookie =
            computerRefreshCookieWithAttributes.split(';')[0];

         const phoneLoginCookies: unknown =
            phoneLoginResponse.headers['set-cookie'];

         if (!Array.isArray(phoneLoginCookies)) {
            throw new Error('Phone Set-Cookie header must be an array');
         }

         const phoneRefreshCookieWithAttributes = phoneLoginCookies.find(
            (cookie: string) => cookie.startsWith('refreshToken='),
         );

         if (typeof phoneRefreshCookieWithAttributes !== 'string') {
            throw new Error('Phone refresh token cookie is missing');
         }

         const phoneRefreshTokenCookie =
            phoneRefreshCookieWithAttributes.split(';')[0];

         // С компьютера завершаем все остальные сессии.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', computerRefreshTokenCookie)
            .expect(204);

         // Сессия компьютера продолжает работать.
         const remainingDevicesResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', computerRefreshTokenCookie)
            .expect(200);

         // В списке остаётся только компьютер.
         expect(remainingDevicesResponse.body).toEqual([
            {
               ip: expect.any(String),
               title: computerTitle,
               lastActiveDate: expect.any(String),
               deviceId: expect.any(String),
            },
         ]);

         // Cookie завершённой сессии телефона больше не даёт доступ.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', phoneRefreshTokenCookie)
            .expect(401);
      });
   });

   describe('DELETE /api/security/devices/:deviceId', () => {
      it('terminates the selected device session and keeps other sessions', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const computerTitle = 'Computer browser';
         const phoneTitle = 'Phone browser';
         const tabletTitle = 'Tablet browser';

         await usersTestManager.createUser(input);

         // Входим с компьютера и сохраняем ответ с cookie.
         const computerLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', computerTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Создаём сессию телефона.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', phoneTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Создаём сессию планшета.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', tabletTitle)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Получаем массив cookie компьютера.
         const computerLoginCookies: unknown =
            computerLoginResponse.headers['set-cookie'];

         if (!Array.isArray(computerLoginCookies)) {
            throw new Error('Computer Set-Cookie header must be an array');
         }

         // Находим refresh cookie компьютера вместе с атрибутами.
         const computerRefreshCookieWithAttributes = computerLoginCookies.find(
            (cookie: string) => cookie.startsWith('refreshToken='),
         );

         if (typeof computerRefreshCookieWithAttributes !== 'string') {
            throw new Error('Computer refresh token cookie is missing');
         }

         // Оставляем имя и значение cookie компьютера.
         const computerRefreshTokenCookie =
            computerRefreshCookieWithAttributes.split(';')[0];

         // Получаем список сессий перед удалением.
         const devicesBeforeDeletionResponse = await request(
            app.getHttpServer(),
         )
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', computerRefreshTokenCookie)
            .expect(200);

         const deviceSessionsBeforeDeletion: DeviceSessionViewDto[] =
            devicesBeforeDeletionResponse.body;

         expect(deviceSessionsBeforeDeletion).toHaveLength(3);

         // Находим сессию телефона, которую хотим завершить.
         const phoneSession = deviceSessionsBeforeDeletion.find(
            (session) => session.title === phoneTitle,
         );

         if (!phoneSession) {
            throw new Error('Phone session is missing');
         }

         // С компьютера удаляем конкретную сессию по её deviceId.
         await request(app.getHttpServer())
            .delete(
               `/${GLOBAL_PREFIX}/security/devices/${phoneSession.deviceId}`,
            )
            .set('Cookie', computerRefreshTokenCookie)
            .expect(204);

         // С компьютера снова получаем список сессий.
         const devicesAfterDeletionResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', computerRefreshTokenCookie)
            .expect(200);

         // Ожидаем прежние сессии компьютера и планшета, без телефона.
         const expectedRemainingSessions = deviceSessionsBeforeDeletion.filter(
            (session) => session.deviceId !== phoneSession.deviceId,
         );

         expect(devicesAfterDeletionResponse.body).toHaveLength(2);
         expect(devicesAfterDeletionResponse.body).toEqual(
            expect.arrayContaining(expectedRemainingSessions),
         );
      });

      it('forbids deleting another user session and keeps that session active', async () => {
         const firstUserInput: CreateUserInputDto = {
            login: 'firstuser',
            email: 'firstuser@example.com',
            password: 'Test12345',
         };

         const secondUserInput: CreateUserInputDto = {
            login: 'seconduser',
            email: 'seconduser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(firstUserInput);
         await usersTestManager.createUser(secondUserInput);

         const firstUserLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', 'First user browser')
            .send({
               loginOrEmail: firstUserInput.login,
               password: firstUserInput.password,
            })
            .expect(200);

         const secondUserLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .set('User-Agent', 'Second user browser')
            .send({
               loginOrEmail: secondUserInput.login,
               password: secondUserInput.password,
            })
            .expect(200);

         // Получаем cookie первого пользователя.
         const firstUserLoginCookies: unknown =
            firstUserLoginResponse.headers['set-cookie'];

         if (!Array.isArray(firstUserLoginCookies)) {
            throw new Error('First user Set-Cookie header must be an array');
         }

         const firstUserRefreshCookieWithAttributes =
            firstUserLoginCookies.find((cookie: string) =>
               cookie.startsWith('refreshToken='),
            );

         if (typeof firstUserRefreshCookieWithAttributes !== 'string') {
            throw new Error('First user refresh token cookie is missing');
         }

         const firstUserRefreshTokenCookie =
            firstUserRefreshCookieWithAttributes.split(';')[0];

         // Получаем cookie второго пользователя.
         const secondUserLoginCookies: unknown =
            secondUserLoginResponse.headers['set-cookie'];

         if (!Array.isArray(secondUserLoginCookies)) {
            throw new Error('Second user Set-Cookie header must be an array');
         }

         const secondUserRefreshCookieWithAttributes =
            secondUserLoginCookies.find((cookie: string) =>
               cookie.startsWith('refreshToken='),
            );

         if (typeof secondUserRefreshCookieWithAttributes !== 'string') {
            throw new Error('Second user refresh token cookie is missing');
         }

         const secondUserRefreshTokenCookie =
            secondUserRefreshCookieWithAttributes.split(';')[0];

         // Второй пользователь получает список своих сессий.
         const secondUserDevicesBeforeResponse = await request(
            app.getHttpServer(),
         )
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', secondUserRefreshTokenCookie)
            .expect(200);

         const secondUserSessions: DeviceSessionViewDto[] =
            secondUserDevicesBeforeResponse.body;

         expect(secondUserSessions).toHaveLength(1);

         const secondUserDeviceId = secondUserSessions[0].deviceId;

         // Первый пользователь пытается удалить сессию второго пользователя.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/security/devices/${secondUserDeviceId}`)
            .set('Cookie', firstUserRefreshTokenCookie)
            .expect(403);

         // Сессия второго пользователя продолжает давать доступ.
         const secondUserDevicesAfterResponse = await request(
            app.getHttpServer(),
         )
            .get(`/${GLOBAL_PREFIX}/security/devices`)
            .set('Cookie', secondUserRefreshTokenCookie)
            .expect(200);

         // Неудачная попытка удаления не изменила его список сессий.
         expect(secondUserDevicesAfterResponse.body).toEqual(
            secondUserSessions,
         );
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
