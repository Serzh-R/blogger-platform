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

      it('returns 400 for an invalid email', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'invalid-email',
            password: 'Test12345',
         };

         // Отправляем данные с некорректным email.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .send(input)
            .expect(400);

         // Проверяем ошибку именно для поля email.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'email',
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

      it('returns 400 for a password shorter than 6 characters', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: '12345',
         };

         // Отправляем пароль из 5 символов при допустимом минимуме 6.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .send(input)
            .expect(400);

         // Проверяем ошибку именно для поля password.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'password',
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

      it('returns 400 for a password longer than 20 characters', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'a'.repeat(21),
         };

         // Отправляем пароль из 21 символа при допустимом максимуме 20.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .send(input)
            .expect(400);

         // Проверяем ошибку именно для поля password.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'password',
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

      it('returns 401 when Basic Auth is missing', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Отправляем корректные данные без Basic Auth.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/users`)
            .send(input)
            .expect(401);

         // Получаем список с корректной авторизацией.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         // Проверяем, что отклонённый запрос не создал пользователя.
         expect(listResponse.body.totalCount).toBe(0);
         expect(listResponse.body.items).toEqual([]);
      });

      it('returns 401 when the Basic Auth password is incorrect', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Передаём правильный логин администратора и неправильный пароль.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'wrong-password')
            .send(input)
            .expect(401);

         // Получаем список с правильными данными администратора.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         // Проверяем, что пользователь не появился в списке.
         expect(listResponse.body.totalCount).toBe(0);
         expect(listResponse.body.items).toEqual([]);
      });

      it('returns 400 when the login is already in use', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Создаём первого пользователя с корректными данными.
         const createdUser = await usersTestManager.createUser(input);

         // Сохраняем тот же логин, но задаём другой корректный email.
         const duplicateInput: CreateUserInputDto = {
            ...input,
            email: 'another@example.com',
         };

         // Пытаемся создать второго пользователя с занятым логином.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .send(duplicateInput)
            .expect(400);

         // Проверяем ошибку именно для поля login.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'login',
                  message: expect.any(String),
               },
            ],
         });

         // Проверяем, что в списке остался только первый пользователь.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         expect(listResponse.body.totalCount).toBe(1);
         expect(listResponse.body.items).toEqual([createdUser]);
      });

      it('returns 400 when the email is already in use', async () => {
         const input: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Создаём первого пользователя.
         const createdUser = await usersTestManager.createUser(input);

         // Меняем логин, но сохраняем email первого пользователя.
         const duplicateInput: CreateUserInputDto = {
            ...input,
            login: 'another',
         };

         // Пытаемся создать второго пользователя с занятым email.
         const response = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .send(duplicateInput)
            .expect(400);

         // Проверяем ошибку именно для поля email.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'email',
                  message: expect.any(String),
               },
            ],
         });

         // Проверяем, что в списке остался только первый пользователь.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         expect(listResponse.body.totalCount).toBe(1);
         expect(listResponse.body.items).toEqual([createdUser]);
      });
   });

   describe('GET /api/users', () => {
      it('returns an empty list with default pagination', async () => {
         // Запрашиваем список без параметров пагинации.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         // Проверяем весь ответ для пустой базы.
         expect(response.body).toEqual({
            pagesCount: 0,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
         });
      });

      it('returns the second page with the remaining user', async () => {
         // Создаём трёх пользователей с разными логинами и email.
         await usersTestManager.createUser({
            login: 'user01',
            email: 'user01@example.com',
            password: 'Test12345',
         });

         await usersTestManager.createUser({
            login: 'user02',
            email: 'user02@example.com',
            password: 'Test12345',
         });

         const thirdUser = await usersTestManager.createUser({
            login: 'user03',
            email: 'user03@example.com',
            password: 'Test12345',
         });

         // Запрашиваем вторую страницу с сортировкой по логину.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               pageNumber: 2,
               pageSize: 2,
               sortBy: 'login',
               sortDirection: 'asc',
            })
            .expect(200);

         // Проверяем пагинацию и точное содержимое второй страницы.
         expect(response.body).toEqual({
            pagesCount: 2,
            page: 2,
            pageSize: 2,
            totalCount: 3,
            items: [thirdUser],
         });
      });

      it('returns 400 when pageNumber is zero', async () => {
         // Запрашиваем страницу с недопустимым номером 0.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               pageNumber: 0,
            })
            .expect(400);

         // Проверяем ошибку именно для параметра pageNumber.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'pageNumber',
                  message: expect.any(String),
               },
            ],
         });
      });

      it('returns 400 when pageNumber is fractional', async () => {
         // Передаём дробный номер страницы.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               pageNumber: 1.5,
            })
            .expect(400);

         // Проверяем ошибку именно для параметра pageNumber.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'pageNumber',
                  message: expect.any(String),
               },
            ],
         });
      });

      it('returns 400 when pageSize is zero', async () => {
         // Передаём недопустимый размер страницы.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               pageSize: 0,
            })
            .expect(400);

         // Проверяем ошибку именно для параметра pageSize.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'pageSize',
                  message: expect.any(String),
               },
            ],
         });
      });

      it('returns 400 when pageSize is fractional', async () => {
         // Передаём дробный размер страницы.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               pageSize: 1.5,
            })
            .expect(400);

         // Проверяем ошибку именно для параметра pageSize.
         expect(response.body).toEqual({
            errorsMessages: [
               {
                  field: 'pageSize',
                  message: expect.any(String),
               },
            ],
         });
      });

      it('filters users by login regardless of case', async () => {
         // Создаём двух пользователей, подходящих под поиск.
         const firstUser = await usersTestManager.createUser({
            login: 'alpha01',
            email: 'first@example.com',
            password: 'Test12345',
         });

         const secondUser = await usersTestManager.createUser({
            login: 'alpha02',
            email: 'second@example.com',
            password: 'Test12345',
         });

         // Создаём пользователя, который не подходит под поиск.
         await usersTestManager.createUser({
            login: 'bravo01',
            email: 'third@example.com',
            password: 'Test12345',
         });

         // Ищем по логину, используя другой регистр букв.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               searchLoginTerm: 'ALPHA',
               sortBy: 'login',
               sortDirection: 'asc',
            })
            .expect(200);

         // Проверяем только подходящих пользователей и их порядок.
         expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 2,
            items: [firstUser, secondUser],
         });
      });

      it('filters users by email regardless of case', async () => {
         // Создаём двух пользователей с email, подходящими под поиск.
         const firstUser = await usersTestManager.createUser({
            login: 'user01',
            email: 'first@example.com',
            password: 'Test12345',
         });

         const secondUser = await usersTestManager.createUser({
            login: 'user02',
            email: 'second@example.com',
            password: 'Test12345',
         });

         // Создаём пользователя с другим доменом email.
         await usersTestManager.createUser({
            login: 'user03',
            email: 'third@other.com',
            password: 'Test12345',
         });

         // Ищем по email, используя другой регистр букв.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               searchEmailTerm: 'EXAMPLE',
               sortBy: 'login',
               sortDirection: 'asc',
            })
            .expect(200);

         // Проверяем найденных пользователей и параметры пагинации.
         expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 2,
            items: [firstUser, secondUser],
         });
      });

      it('returns users matching either login or email without duplicates', async () => {
         // Этот пользователь подходит только по логину.
         const loginMatchUser = await usersTestManager.createUser({
            login: 'alpha01',
            email: 'first@other.com',
            password: 'Test12345',
         });

         // Этот пользователь подходит только по email.
         const emailMatchUser = await usersTestManager.createUser({
            login: 'beta01',
            email: 'second@example.com',
            password: 'Test12345',
         });

         // Этот пользователь подходит по обоим условиям.
         const bothMatchUser = await usersTestManager.createUser({
            login: 'alpha02',
            email: 'third@example.com',
            password: 'Test12345',
         });

         // Этот пользователь не подходит ни по одному условию.
         await usersTestManager.createUser({
            login: 'gamma01',
            email: 'fourth@other.com',
            password: 'Test12345',
         });

         // Передаём оба условия поиска.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               searchLoginTerm: 'alpha',
               searchEmailTerm: 'example',
               sortBy: 'login',
               sortDirection: 'asc',
            })
            .expect(200);

         // Проверяем объединение результатов без повторения пользователей.
         expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 3,
            items: [loginMatchUser, bothMatchUser, emailMatchUser],
         });
      });

      it('returns users sorted by login in descending order', async () => {
         // Создаём пользователей в порядке возрастания логинов.
         const firstUser = await usersTestManager.createUser({
            login: 'user01',
            email: 'user01@example.com',
            password: 'Test12345',
         });

         const secondUser = await usersTestManager.createUser({
            login: 'user02',
            email: 'user02@example.com',
            password: 'Test12345',
         });

         const thirdUser = await usersTestManager.createUser({
            login: 'user03',
            email: 'user03@example.com',
            password: 'Test12345',
         });

         // Запрашиваем сортировку по логину по убыванию.
         const response = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .query({
               sortBy: 'login',
               sortDirection: 'desc',
            })
            .expect(200);

         // Проверяем обратный порядок пользователей.
         expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 3,
            items: [thirdUser, secondUser, firstUser],
         });
      });

      it('returns 401 when Basic Auth is missing', async () => {
         // Создаём пользователя, чтобы в базе были данные.
         await usersTestManager.createUser({
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         });

         // Запрашиваем список без Basic Auth.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .expect(401);
      });
   });

   describe('DELETE /api/users/:id', () => {
      it('deletes an existing user and removes them from the list', async () => {
         // Создаём пользователя для удаления.
         const createdUser = await usersTestManager.createUser({
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         });

         // Удаляем пользователя по полученному идентификатору.
         const deleteResponse = await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Ответ 204 не должен содержать тело.
         expect(deleteResponse.text).toBe('');

         // Запрашиваем список после удаления.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         // Проверяем, что удалённый пользователь отсутствует в списке.
         expect(listResponse.body.totalCount).toBe(0);
         expect(listResponse.body.items).toEqual([]);
      });

      it('returns 404 when the user does not exist', async () => {
         // Используем корректный по формату идентификатор отсутствующего пользователя.
         const missingUserId = '000000000000000000000001';

         // Пытаемся удалить пользователя, которого нет в базе.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${missingUserId}`)
            .auth('admin', 'qwerty')
            .expect(404);
      });

      it('returns 404 when the user ID format is invalid', async () => {
         // Передаём идентификатор, который не соответствует формату ObjectId.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/123`)
            .auth('admin', 'qwerty')
            .expect(404);
      });

      it('returns 404 when the user has already been deleted', async () => {
         // Создаём пользователя для проверки повторного удаления.
         const createdUser = await usersTestManager.createUser({
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         });

         // Первое удаление должно завершиться успешно.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Повторное удаление того же пользователя должно вернуть 404.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .auth('admin', 'qwerty')
            .expect(404);
      });

      it('returns 401 without Basic Auth and keeps the user in the list', async () => {
         // Создаём пользователя с корректной авторизацией.
         const createdUser = await usersTestManager.createUser({
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         });

         // Пытаемся удалить существующего пользователя без Basic Auth.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .expect(401);

         // Получаем список с правильной авторизацией.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         // Проверяем, что пользователь не был удалён.
         expect(listResponse.body.totalCount).toBe(1);
         expect(listResponse.body.items).toEqual([createdUser]);
      });

      it('returns 401 with an incorrect Basic Auth password and keeps the user', async () => {
         // Создаём пользователя с правильной авторизацией.
         const createdUser = await usersTestManager.createUser({
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         });

         // Пытаемся удалить пользователя с неверным паролем администратора.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${createdUser.id}`)
            .auth('admin', 'wrong-password')
            .expect(401);

         // Получаем список с правильным паролем администратора.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         // Проверяем, что пользователь сохранился.
         expect(listResponse.body.totalCount).toBe(1);
         expect(listResponse.body.items).toEqual([createdUser]);
      });

      it('deletes only the specified user and keeps the other user', async () => {
         // Создаём пользователя, которого будем удалять.
         const firstUser = await usersTestManager.createUser({
            login: 'user01',
            email: 'user01@example.com',
            password: 'Test12345',
         });

         // Создаём пользователя, который должен сохраниться.
         const secondUser = await usersTestManager.createUser({
            login: 'user02',
            email: 'user02@example.com',
            password: 'Test12345',
         });

         // Удаляем только первого пользователя.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/users/${firstUser.id}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Получаем список после удаления.
         const listResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/users`)
            .auth('admin', 'qwerty')
            .expect(200);

         // Проверяем, что в списке остался именно второй пользователь.
         expect(listResponse.body.totalCount).toBe(1);
         expect(listResponse.body.items).toEqual([secondUser]);
      });
   });

   afterAll(async () => {
      // Закрываем приложение после завершения тестов.
      if (app) {
         await app.close();
      }
   });
});
