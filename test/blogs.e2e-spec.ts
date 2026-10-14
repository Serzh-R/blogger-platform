import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateBlogInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import type { UpdateBlogInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/update-blog.input-dto';
import type { BlogViewDto } from '../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import type { CreatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/create-post.input-dto';
import type { CreateCommentInputDto } from '../src/modules/bloggers-platform/comments/api/input-dto/create-comment.input-dto';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { UsersTestManager } from './helpers/users-test-manager';
import { createBlogTestData } from './helpers/blog-test-data';

describe('Blogs (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
      const settings = await initSettings();

      app = settings.app;
      usersTestManager = settings.usersTestManager;
   });

   beforeEach(async () => {
      await deleteAllData(app);
   });

   describe('POST /api/blogs', () => {
      it('creates a blog with valid data', async () => {
         const blogInput = createBlogTestData();

         // Создаём блог с авторизацией администратора.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         // Проверяем данные и формат ответа созданного блога.
         expect(createBlogResponse.body).toEqual({
            id: expect.any(String),
            name: blogInput.name,
            description: blogInput.description,
            websiteUrl: blogInput.websiteUrl,
            createdAt: expect.any(String),
            isMembership: false,
         });
      });

      it('rejects an invalid website URL and does not create a blog', async () => {
         const invalidBlogInput = createBlogTestData({
            websiteUrl: 'not-a-url',
         });

         // Пытаемся создать блог с некорректным адресом сайта.
         const createBlogErrorResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(invalidBlogInput)
            .expect(400);

         // Проверяем, что сервер указал ошибку именно поля websiteUrl.
         expect(createBlogErrorResponse.body).toEqual({
            errorsMessages: [
               {
                  field: 'websiteUrl',
                  message: expect.any(String),
               },
            ],
         });

         // Получаем список блогов после отклонённого запроса.
         const getBlogsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs`)
            .expect(200);

         // Блог с некорректными данными не должен сохраниться.
         expect(getBlogsResponse.body).toEqual({
            pagesCount: 0,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
         });
      });

      it('rejects blog creation without authorization', async () => {
         const blogInput = createBlogTestData();

         // Отправляем корректные данные без Basic Auth.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .send(blogInput)
            .expect(401);

         // Проверяем, что запрос без авторизации не создал блог.
         const getBlogsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs`)
            .expect(200);

         expect(getBlogsResponse.body.totalCount).toBe(0);
         expect(getBlogsResponse.body.items).toEqual([]);
      });
   });

   describe('GET /api/blogs/:id', () => {
      it('returns an existing blog by id', async () => {
         const blogInput = createBlogTestData();

         // Создаём блог, который затем будем запрашивать.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         // Получаем ID созданного блога из ответа сервера.
         const createdBlogId = createBlogResponse.body.id;

         // Запрашиваем блог по его ID без авторизации.
         const getBlogResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}`)
            .expect(200);

         // Проверяем, что вернулся тот же блог со всеми его полями.
         expect(getBlogResponse.body).toEqual(createBlogResponse.body);
      });
   });

   describe('PUT /api/blogs/:id', () => {
      it('updates an existing blog with valid data', async () => {
         const originalBlogInput = createBlogTestData();

         // Создаём блог с исходными данными.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(originalBlogInput)
            .expect(201);

         const createdBlogId = createBlogResponse.body.id;

         const updatedBlogInput: UpdateBlogInputDto = {
            name: 'Updated blog',
            description: 'Updated description about NestJS',
            websiteUrl: 'https://updated.example.com',
         };

         // Изменяем все редактируемые поля блога.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}`)
            .auth('admin', 'qwerty')
            .send(updatedBlogInput)
            .expect(204);

         // Получаем блог после обновления.
         const getUpdatedBlogResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}`)
            .expect(200);

         // Проверяем новые данные и сохранение исходных служебных полей.
         expect(getUpdatedBlogResponse.body).toEqual({
            id: createdBlogId,
            name: updatedBlogInput.name,
            description: updatedBlogInput.description,
            websiteUrl: updatedBlogInput.websiteUrl,
            createdAt: createBlogResponse.body.createdAt,
            isMembership: false,
         });
      });
   });

   describe('DELETE /api/blogs/:id', () => {
      it('deletes an existing blog', async () => {
         const blogInput = createBlogTestData();

         // Создаём блог, который затем удалим.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const createdBlogId = createBlogResponse.body.id;

         // Удаляем блог с авторизацией администратора.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Проверяем, что удалённый блог больше недоступен.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}`)
            .expect(404);
      });
   });

   describe('GET /api/blogs', () => {
      it('returns the requested page of blogs with pagination metadata', async () => {
         const blogsToCreate: CreateBlogInputDto[] = [
            {
               name: 'NestJS blog',
               description: 'A blog about NestJS',
               websiteUrl: 'https://nestjs.example.com',
            },
            {
               name: 'Express blog',
               description: 'A blog about Express',
               websiteUrl: 'https://express.example.com',
            },
            {
               name: 'MongoDB blog',
               description: 'A blog about MongoDB',
               websiteUrl: 'https://mongodb.example.com',
            },
         ];

         const createdBlogs: BlogViewDto[] = [];

         // Последовательно создаём три блога и сохраняем ответы сервера.
         for (const blogInput of blogsToCreate) {
            const createBlogResponse = await request(app.getHttpServer())
               .post(`/${GLOBAL_PREFIX}/blogs`)
               .auth('admin', 'qwerty')
               .send(blogInput)
               .expect(201);

            createdBlogs.push(createBlogResponse.body);
         }

         // Запрашиваем вторую страницу с сортировкой по имени.
         const getBlogsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs`)
            .query({
               pageNumber: 2,
               pageSize: 2,
               sortBy: 'name',
               sortDirection: 'asc',
            })
            .expect(200);

         // NestJS создан первым, но по алфавиту находится последним.
         const expectedBlogOnSecondPage = createdBlogs[0];

         // На второй странице остаётся один блог из трёх.
         expect(getBlogsResponse.body).toEqual({
            pagesCount: 2,
            page: 2,
            pageSize: 2,
            totalCount: 3,
            items: [expectedBlogOnSecondPage],
         });
      });

      it('returns only blogs matching the name search regardless of case', async () => {
         const blogsToCreate: CreateBlogInputDto[] = [
            {
               name: 'NestJS blog',
               description: 'A blog about NestJS',
               websiteUrl: 'https://nestjs.example.com',
            },
            {
               name: 'Express blog',
               description: 'A blog about Express',
               websiteUrl: 'https://express.example.com',
            },
         ];

         const createdBlogs: BlogViewDto[] = [];

         // Создаём два блога с разными именами.
         for (const blogInput of blogsToCreate) {
            const createBlogResponse = await request(app.getHttpServer())
               .post(`/${GLOBAL_PREFIX}/blogs`)
               .auth('admin', 'qwerty')
               .send(blogInput)
               .expect(201);

            createdBlogs.push(createBlogResponse.body);
         }

         // Ищем по части имени, введённой маленькими буквами.
         const searchBlogsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs`)
            .query({
               searchNameTerm: 'nest',
            })
            .expect(200);

         // Первый созданный блог — NestJS blog, он подходит под поиск.
         const expectedMatchingBlog = createdBlogs[0];

         // Проверяем, что в результате только подходящий блог.
         expect(searchBlogsResponse.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [expectedMatchingBlog],
         });
      });
   });

   describe('Posts and comments after blog deletion', () => {
      it('deletes blog descendants and preserves another blog data', async () => {
         const userInput: CreateUserInputDto = {
            login: 'author',
            email: 'author@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(userInput);

         const firstBlogInput = createBlogTestData({
            websiteUrl: 'https://backend.example.com',
         });

         const secondBlogInput: CreateBlogInputDto = {
            name: 'Frontend blog',
            description: 'A blog about frontend development',
            websiteUrl: 'https://frontend.example.com',
         };

         // Создаём два независимых блога.
         const createFirstBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(firstBlogInput)
            .expect(201);

         const firstBlogId = createFirstBlogResponse.body.id;

         const createSecondBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(secondBlogInput)
            .expect(201);

         const secondBlogId = createSecondBlogResponse.body.id;

         const firstBlogPostInput: CreatePostInputDto = {
            title: 'NestJS basics',
            shortDescription: 'Introduction to NestJS',
            content: 'How to get started with NestJS.',
            blogId: firstBlogId,
         };

         const secondBlogPostInput: CreatePostInputDto = {
            title: 'React basics',
            shortDescription: 'Introduction to React',
            content: 'How to get started with React.',
            blogId: secondBlogId,
         };

         // Создаём по одному посту в каждом блоге.
         const createFirstBlogPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(firstBlogPostInput)
            .expect(201);

         const firstBlogPostId = createFirstBlogPostResponse.body.id;

         const createSecondBlogPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(secondBlogPostInput)
            .expect(201);

         const secondBlogPostId = createSecondBlogPostResponse.body.id;

         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const authorAccessToken = loginResponse.body.accessToken;

         const commentInput: CreateCommentInputDto = {
            content: 'This article was useful and easy to understand.',
         };

         // Добавляем по одному комментарию к каждому посту.
         const createFirstBlogCommentResponse = await request(
            app.getHttpServer(),
         )
            .post(`/${GLOBAL_PREFIX}/posts/${firstBlogPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(commentInput)
            .expect(201);

         const firstBlogCommentId = createFirstBlogCommentResponse.body.id;

         const createSecondBlogCommentResponse = await request(
            app.getHttpServer(),
         )
            .post(`/${GLOBAL_PREFIX}/posts/${secondBlogPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(commentInput)
            .expect(201);

         const secondBlogCommentId = createSecondBlogCommentResponse.body.id;

         // Администратор удаляет первый блог.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/blogs/${firstBlogId}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Блог, его пост и комментарий больше не доступны.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${firstBlogId}`)
            .expect(404);

         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${firstBlogPostId}`)
            .expect(404);

         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/comments/${firstBlogCommentId}`)
            .expect(404);

         // Второй блог остаётся доступным и неизменённым.
         const getSecondBlogResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${secondBlogId}`)
            .expect(200);

         expect(getSecondBlogResponse.body).toEqual(
            createSecondBlogResponse.body,
         );

         // Его пост также сохраняется.
         const getSecondBlogPostResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${secondBlogPostId}`)
            .expect(200);

         expect(getSecondBlogPostResponse.body).toEqual(
            createSecondBlogPostResponse.body,
         );

         // И комментарий к этому посту сохраняется.
         const getSecondBlogCommentResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/comments/${secondBlogCommentId}`)
            .expect(200);

         expect(getSecondBlogCommentResponse.body).toEqual(
            createSecondBlogCommentResponse.body,
         );
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
