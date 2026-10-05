import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';

describe('Users (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
      // Создаём приложение один раз для этой группы тестов.
      const result = await initSettings();

      app = result.app;
      usersTestManager = result.usersTestManager;
   });

   beforeEach(async () => {
      // Каждый сценарий начинает работу с пустой тестовой базой.
      await deleteAllData(app);
   });

   describe('POST /api/users', () => {
      it('creates a user with valid data: 201', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const createdUser = await usersTestManager.createUser(input);

         // Проверяем точную структуру ответа.
         expect(createdUser).toEqual({
            id: expect.any(String),
            login: input.login,
            email: input.email,
            createdAt: expect.any(String),
         });

         // Проверяем, что созданный пользователь доступен в списке.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         expect(listResponse.body.totalCount).toBe(1);
         expect(listResponse.body.items).toEqual([createdUser]);
      });
   });

   it('returns 400 for a login shorter than 3 characters', async () => {
      const input: CreateUserInputDto = {
         login: 'ab',
         email: 'testuser@example.com',
         password: 'Test12345',
      };

      // Отправляем данные с некорректной длиной логина.
      const response = await request(app.getHttpServer())
         .post(`/${GLOBAL_PREFIX}/users`)
         .auth('admin', 'qwerty')
         .send(input)
         .expect(400);

      // Проверяем, что ответ содержит ошибку именно для login.
      expect(response.body).toEqual({
         errorsMessages: [
            {
               field: 'login',
               message: expect.any(String),
            },
         ],
      });

      // Проверяем, что пользователь не появился в списке.
      const listResponse = await request(app.getHttpServer())
         .get(`/${GLOBAL_PREFIX}/users`)
         .auth('admin', 'qwerty')
         .expect(200);

      expect(listResponse.body.totalCount).toBe(0);
      expect(listResponse.body.items).toEqual([]);
   });

   it('returns 400 for a login longer than 10 characters', async () => {
      const input: CreateUserInputDto = {
         login: 'testuser123',
         email: 'testuser@example.com',
         password: 'Test12345',
      };

      // Отправляем логин из 11 символов при допустимом максимуме 10.
      const response = await request(app.getHttpServer())
         .post(`/${GLOBAL_PREFIX}/users`)
         .auth('admin', 'qwerty')
         .send(input)
         .expect(400);

      // Проверяем ошибку для поля login.
      expect(response.body).toEqual({
         errorsMessages: [
            {
               field: 'login',
               message: expect.any(String),
            },
         ],
      });

      // Проверяем, что пользователь не появился в списке.
      const listResponse = await request(app.getHttpServer())
         .get(`/${GLOBAL_PREFIX}/users`)
         .auth('admin', 'qwerty')
         .expect(200);

      expect(listResponse.body.totalCount).toBe(0);
      expect(listResponse.body.items).toEqual([]);
   });

   afterAll(async () => {
      // Закрываем приложение после завершения тестов.
      if (app) {
         await app.close();
      }
   });
});
