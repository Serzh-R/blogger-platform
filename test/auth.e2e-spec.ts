import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';

describe('Auth (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
      const result = await initSettings((moduleBuilder) => {
         // Подменяем ограничитель запросов для этих сценариев Auth.
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

   describe('POST /api/auth/login', () => {
      it('signs in with valid credentials and returns both tokens', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Создаём пользователя через API.
         await usersTestManager.createUser(input);

         // Выполняем вход с правильными логином и паролем.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Проверяем, что тело ответа содержит access token.
         expect(response.body).toEqual({
            accessToken: expect.any(String),
         });

         // Проверяем, что access token не пустой.
         expect(response.body.accessToken).not.toBe('');

         // Получаем заголовок с cookie.
         const cookies: unknown = response.headers['set-cookie'];

         // Проверяем наличие массива и уточняем тип для TypeScript.
         if (!Array.isArray(cookies)) {
            throw new Error('Set-Cookie header must be an array');
         }

         // Находим cookie с refresh token.
         const refreshCookie = cookies.find((cookie: string) =>
            cookie.startsWith('refreshToken='),
         );

         // Проверяем, что refresh token присутствует и не пустой.
         expect(refreshCookie).toMatch(/^refreshToken=[^;]+;/);

         // Проверяем защитные атрибуты cookie.
         expect(refreshCookie).toContain('HttpOnly');
         expect(refreshCookie).toContain('Secure');
      });

      it('signs in with a valid email and password', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Создаём пользователя через API.
         await usersTestManager.createUser(input);

         // Выполняем вход по email вместо логина.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.email,
               password: input.password,
            })
            .expect(200);

         // Проверяем структуру ответа и непустой access token.
         expect(response.body).toEqual({
            accessToken: expect.any(String),
         });
         expect(response.body.accessToken).not.toBe('');
      });

      it('returns 401 when the password is incorrect', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Создаём пользователя с правильным паролем.
         await usersTestManager.createUser(input);

         // Передаём существующий логин, но неправильный пароль.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: 'Wrong12345',
            })
            .expect(401);

         // Проверяем, что access token не выдан.
         expect(response.body.accessToken).toBeUndefined();

         // Проверяем, что cookie с refresh token не установлена.
         expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('returns 401 when the login does not exist', async () => {
         // Пользователя не создаём: beforeEach уже очистил тестовую базу.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: 'nouser',
               password: 'Test12345',
            })
            .expect(401);

         // Проверяем, что access token не выдан.
         expect(response.body.accessToken).toBeUndefined();

         // Проверяем, что cookie с refresh token не установлена.
         expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('returns 401 when the user has been deleted', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Создаём пользователя и получаем его идентификатор.
         const createdUser = await usersTestManager.createUser(input);

         // Удаляем пользователя с правильной Basic Auth.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Пытаемся войти с прежними правильными логином и паролем.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(401);

         // Проверяем, что токены не выданы.
         expect(response.body.accessToken).toBeUndefined();
         expect(response.headers['set-cookie']).toBeUndefined();
      });
   });

   describe('GET /api/auth/me', () => {
      it('returns the current user with a valid access token', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const createdUser = await usersTestManager.createUser(input);

         // Выполняем вход и получаем access token.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         const accessToken = loginResponse.body.accessToken;

         // Запрашиваем данные пользователя с полученным токеном.
         const meResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/auth/me`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

         // Проверяем точный состав ответа и принадлежность пользователя.
         expect(meResponse.body).toEqual({
            email: input.email,
            login: input.login,
            userId: createdUser.id,
         });
      });

      it('returns 401 when the access token is missing', async () => {
         // Отправляем запрос без заголовка Authorization.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/auth/me`)
            .expect(401);
      });

      it('returns 401 when the access token is malformed', async () => {
         // Передаём Bearer-токен, который не соответствует формату JWT.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/auth/me`)
            .set('Authorization', 'Bearer invalid-token')
            .expect(401);
      });

      it('returns 401 when the access token signature is invalid', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(input);

         // Выполняем вход и получаем настоящий access token.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Разделяем JWT на заголовок, payload и подпись.
         const tokenParts: string[] = loginResponse.body.accessToken.split('.');

         // Подменяем подпись, сохраняя заголовок и payload.
         tokenParts[2] = 'invalid-signature';

         // Собираем токен с изменённой подписью.
         const tamperedAccessToken = tokenParts.join('.');

         // Проверяем, что приложение отклоняет такой токен.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/auth/me`)
            .set('Authorization', `Bearer ${tamperedAccessToken}`)
            .expect(401);
      });

      it('returns 401 when the token belongs to a deleted user', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const createdUser = await usersTestManager.createUser(input);

         // Получаем access token до удаления пользователя.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         const accessToken = loginResponse.body.accessToken;

         // Удаляем пользователя.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Обращаемся к защищённому маршруту с ранее выданным токеном.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/auth/me`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(401);
      });

      it('returns 401 when the access token has expired', async () => {
         const createdUser = await usersTestManager.createUser({
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         });

         // Получаем зарегистрированные зависимости из тестового приложения.
         const jwtService = app.get(JwtService);
         const userAccountsConfig = app.get(UserAccountsConfig);

         // Создаём токен с правильной подписью, истёкший минуту назад.
         const expiredAccessToken = await jwtService.signAsync(
            {
               userId: createdUser.id,
               exp: Math.floor(Date.now() / 1000) - 60,
            },
            {
               secret: userAccountsConfig.accessTokenSecret,
            },
         );

         // Проверяем отказ в доступе с просроченным токеном.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/auth/me`)
            .set('Authorization', `Bearer ${expiredAccessToken}`)
            .expect(401);
      });
   });

   describe('POST /api/auth/refresh-token', () => {
      it('returns both tokens with a valid refresh token', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(input);

         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Получаем cookie, установленную при входе.
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

         // Оставляем имя и значение cookie без атрибутов.
         const cookieHeader = loginRefreshCookie.split(';')[0];

         // Отправляем refresh token для обновления токенов.
         const refreshResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
            .set('Cookie', cookieHeader)
            .expect(200);

         // Проверяем access token в теле ответа.
         expect(refreshResponse.body).toEqual({
            accessToken: expect.any(String),
         });
         expect(refreshResponse.body.accessToken).not.toBe('');

         // Проверяем refresh cookie в ответе.
         const refreshCookies: unknown = refreshResponse.headers['set-cookie'];

         if (!Array.isArray(refreshCookies)) {
            throw new Error('Set-Cookie header must be an array');
         }

         const refreshCookie = refreshCookies.find((cookie: string) =>
            cookie.startsWith('refreshToken='),
         );

         expect(refreshCookie).toMatch(/^refreshToken=[^;]+;/);
         expect(refreshCookie).toContain('HttpOnly');
         expect(refreshCookie).toContain('Secure');
      });

      it('returns 401 when the refresh token cookie is missing', async () => {
         // Отправляем запрос без заголовка Cookie.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
            .expect(401);

         // Проверяем, что access token не выдан.
         expect(response.body.accessToken).toBeUndefined();

         // Проверяем, что refresh cookie не установлена.
         expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('returns 401 when the refresh token is malformed', async () => {
         // Передаём cookie с токеном неправильного формата.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
            .set('Cookie', 'refreshToken=invalid-token')
            .expect(401);

         // Проверяем, что access token не выдан.
         expect(response.body.accessToken).toBeUndefined();

         // Проверяем, что refresh cookie не установлена.
         expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('returns 401 when an access token is used as a refresh token', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(input);

         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Получаем access token из тела ответа.
         const accessToken = loginResponse.body.accessToken;

         // Намеренно передаём access token в cookie для refresh token.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
            .set('Cookie', `refreshToken=${accessToken}`)
            .expect(401);

         // Проверяем, что токены не выданы.
         expect(response.body.accessToken).toBeUndefined();
         expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('returns 401 when the refresh token signature is invalid', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(input);

         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Находим cookie с настоящим refresh token.
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

         // Убираем атрибуты cookie, затем её имя и знак равенства.
         const cookieHeader = loginRefreshCookie.split(';')[0];
         const refreshToken = cookieHeader.slice('refreshToken='.length);

         // Подменяем только подпись JWT.
         const tokenParts = refreshToken.split('.');
         tokenParts[2] = 'invalid-signature';

         const tamperedRefreshToken = tokenParts.join('.');

         // Передаём изменённый токен в cookie.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
            .set('Cookie', `refreshToken=${tamperedRefreshToken}`)
            .expect(401);

         // Проверяем, что токены не выданы.
         expect(response.body.accessToken).toBeUndefined();
         expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('returns 401 when the refresh token has expired', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(input);

         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

         // Получаем cookie с настоящим refresh token.
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

         // Извлекаем значение токена из cookie.
         const cookieHeader = loginRefreshCookie.split(';')[0];
         const refreshToken = cookieHeader.slice('refreshToken='.length);

         const jwtService = app.get(JwtService);
         const userAccountsConfig = app.get(UserAccountsConfig);

         // Проверяем настоящий токен и получаем его данные.
         const payload = await jwtService.verifyAsync<{
            userId: string;
            deviceId: string;
            iat: number;
            exp: number;
         }>(refreshToken, {
            secret: userAccountsConfig.refreshTokenSecret,
         });

         // Сохраняем данные токена, заменяем только срок окончания действия.
         const expiredRefreshToken = await jwtService.signAsync(
            {
               ...payload,
               exp: Math.floor(Date.now() / 1000) - 60,
            },
            {
               secret: userAccountsConfig.refreshTokenSecret,
            },
         );

         // Отправляем правильно подписанный, но просроченный токен.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
            .set('Cookie', `refreshToken=${expiredRefreshToken}`)
            .expect(401);

         // Проверяем, что токены не выданы.
         expect(response.body.accessToken).toBeUndefined();
         expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('returns 401 when the refresh token belongs to a deleted user', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const createdUser = await usersTestManager.createUser(input);

         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: input.login,
               password: input.password,
            })
            .expect(200);

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

         const cookieHeader = loginRefreshCookie.split(';')[0];

         // Удаляем пользователя с правильной Basic Auth.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Пытаемся обновить токены с ранее полученной cookie.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
            .set('Cookie', cookieHeader)
            .expect(401);

         // Проверяем, что токены не выданы.
         expect(response.body.accessToken).toBeUndefined();
         expect(response.headers['set-cookie']).toBeUndefined();
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
