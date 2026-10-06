import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';

describe('Auth (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
      // Создаём приложение и получаем менеджер пользователей.
      const result = await initSettings();

      app = result.app;
      usersTestManager = result.usersTestManager;
   });

   beforeEach(async () => {
      await deleteAllData(app);
   });

   describe('POST /api/auth/login', () => {
      it('signs in with valid credentials and returns both tokens', async () => {
         // Подготавливаем данные пользователя.
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
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
