import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import type { DeviceSessionViewDto } from '../src/modules/user-accounts/api/view-dto/device-session.view-dto';
import { createUserTestData } from './helpers/user-test-data';
import { getRefreshTokenCookie } from './helpers/refresh-token-cookie';

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
         const input = createUserTestData();

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

         // Получаем имя и значение refresh cookie из ответа на вход.
         const refreshTokenCookie = getRefreshTokenCookie(
            loginResponse.headers['set-cookie'],
         );

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
         const input = createUserTestData();

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

         // Получаем имя и значение refresh cookie сессии компьютера.
         const computerRefreshTokenCookie = getRefreshTokenCookie(
            computerLoginResponse.headers['set-cookie'],
         );

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
         const input = createUserTestData();

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

         // Получаем refresh cookie сессии компьютера.
         const computerRefreshTokenCookie = getRefreshTokenCookie(
            computerLoginResponse.headers['set-cookie'],
         );

         // Получаем refresh cookie сессии телефона.
         const phoneRefreshTokenCookie = getRefreshTokenCookie(
            phoneLoginResponse.headers['set-cookie'],
         );

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
         const input = createUserTestData();

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

         // Получаем refresh cookie сессии компьютера.
         const computerRefreshTokenCookie = getRefreshTokenCookie(
            computerLoginResponse.headers['set-cookie'],
         );

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

         // Получаем refresh cookie первого пользователя.
         const firstUserRefreshTokenCookie = getRefreshTokenCookie(
            firstUserLoginResponse.headers['set-cookie'],
         );

         // Получаем refresh cookie второго пользователя.
         const secondUserRefreshTokenCookie = getRefreshTokenCookie(
            secondUserLoginResponse.headers['set-cookie'],
         );

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
