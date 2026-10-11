import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';

describe('Rate limiting (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeEach(async () => {
      // Создаём новое приложение с настоящим ограничителем запросов.
      const settings = await initSettings();

      app = settings.app;
      usersTestManager = settings.usersTestManager;

      await deleteAllData(app);
   });

   describe('POST /api/auth/login', () => {
      it('returns 429 after five login attempts with a wrong password', async () => {
         const userInput: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(userInput);

         const loginWithWrongPasswordInput = {
            loginOrEmail: userInput.login,
            password: 'WrongPass123',
         };

         // Первые пять запросов проходят ограничитель,
         // но отклоняются из-за неверного пароля.
         for (let attemptNumber = 1; attemptNumber <= 5; attemptNumber += 1) {
            await request(app.getHttpServer())
               .post(`/${GLOBAL_PREFIX}/auth/login`)
               .send(loginWithWrongPasswordInput)
               .expect(401);
         }

         // Шестой запрос отклоняет уже ограничитель запросов.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send(loginWithWrongPasswordInput)
            .expect(429);
      });
   });

   afterEach(async () => {
      if (app) {
         await app.close();
      }
   });
});
