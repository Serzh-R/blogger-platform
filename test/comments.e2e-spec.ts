import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { CreateBlogInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';
import type { CreateCommentInputDto } from '../src/modules/bloggers-platform/comments/api/input-dto/create-comment.input-dto';
import type { CreatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/create-post.input-dto';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import type { UpdateCommentInputDto } from '../src/modules/bloggers-platform/comments/api/input-dto/update-comment.input-dto';

describe('Comments (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
      // Используем ту же подмену ограничения запросов, что в тестах auth.
      const settings = await initSettings((moduleBuilder) => {
         moduleBuilder.overrideGuard(ThrottlerGuard).useValue({
            canActivate: () => true,
         });
      });

      app = settings.app;
      usersTestManager = settings.usersTestManager;
   });

   beforeEach(async () => {
      await deleteAllData(app);
   });

   describe('POST /api/posts/:postId/comments', () => {
      it('creates a comment from an authenticated user', async () => {
         const userInput: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         // Создаём пользователя, который будет автором комментария.
         const createdUser = await usersTestManager.createUser(userInput);

         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог для поста.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const createdBlogId = createBlogResponse.body.id;

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createdBlogId,
         };

         // Создаём пост, к которому пользователь добавит комментарий.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Входим под созданным пользователем.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const userAccessToken = loginResponse.body.accessToken;

         const commentInput: CreateCommentInputDto = {
            content: 'This post helped me understand NestJS controllers.',
         };

         // Добавляем комментарий с access токеном пользователя.
         const createCommentResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send(commentInput)
            .expect(201);

         // Проверяем текст, данные автора и начальные значения лайков.
         expect(createCommentResponse.body).toEqual({
            id: expect.any(String),
            content: commentInput.content,
            commentatorInfo: {
               userId: createdUser.id,
               userLogin: createdUser.login,
            },
            createdAt: expect.any(String),
            likesInfo: {
               likesCount: 0,
               dislikesCount: 0,
               myStatus: 'None',
            },
         });
      });

      it('rejects comment creation without authorization', async () => {
         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог для поста.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createBlogResponse.body.id,
         };

         // Создаём пост, который посетитель попытается прокомментировать.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         const commentInput: CreateCommentInputDto = {
            content: 'This post helped me understand NestJS controllers.',
         };

         // Отправляем корректный комментарий без access токена.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .send(commentInput)
            .expect(401);

         // Проверяем, что комментарий не был создан.
         const getPostCommentsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .expect(200);

         expect(getPostCommentsResponse.body.totalCount).toBe(0);
         expect(getPostCommentsResponse.body.items).toEqual([]);
      });
   });

   describe('GET /api/comments/:id', () => {
      it('returns an existing comment by id', async () => {
         const userInput: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(userInput);

         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог для поста.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createBlogResponse.body.id,
         };

         // Создаём пост для комментария.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Получаем access токен автора комментария.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const userAccessToken = loginResponse.body.accessToken;

         const commentInput: CreateCommentInputDto = {
            content: 'This post helped me understand NestJS controllers.',
         };

         // Создаём комментарий под авторизованным пользователем.
         const createCommentResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send(commentInput)
            .expect(201);

         const createdCommentId = createCommentResponse.body.id;

         // Получаем комментарий по его ID без авторизации.
         const getCommentResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .expect(200);

         // Проверяем все поля полученного комментария.
         expect(getCommentResponse.body).toEqual(createCommentResponse.body);
      });
   });

   describe('PUT /api/comments/:id', () => {
      it('allows the author to update their own comment', async () => {
         const userInput: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         const createdUser = await usersTestManager.createUser(userInput);

         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог для поста.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createBlogResponse.body.id,
         };

         // Создаём пост для комментария.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Получаем access токен автора.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const authorAccessToken = loginResponse.body.accessToken;

         const originalCommentInput: CreateCommentInputDto = {
            content: 'This post helped me understand NestJS controllers.',
         };

         // Создаём комментарий с исходным текстом.
         const createCommentResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(originalCommentInput)
            .expect(201);

         const createdCommentId = createCommentResponse.body.id;

         const updatedCommentInput: UpdateCommentInputDto = {
            content: 'Now I understand how NestJS controllers handle requests.',
         };

         // Автор изменяет текст своего комментария.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(updatedCommentInput)
            .expect(204);

         // Получаем комментарий после редактирования.
         const getUpdatedCommentResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .expect(200);

         // Проверяем новый текст и сохранение остальных полей.
         expect(getUpdatedCommentResponse.body).toEqual({
            id: createdCommentId,
            content: updatedCommentInput.content,
            commentatorInfo: {
               userId: createdUser.id,
               userLogin: createdUser.login,
            },
            createdAt: createCommentResponse.body.createdAt,
            likesInfo: {
               likesCount: 0,
               dislikesCount: 0,
               myStatus: 'None',
            },
         });
      });
   });

   describe('DELETE /api/comments/:id', () => {
      it('allows the author to delete their own comment', async () => {
         const userInput: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(userInput);

         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог для поста.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createBlogResponse.body.id,
         };

         // Создаём пост для комментария.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Получаем access токен автора комментария.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const authorAccessToken = loginResponse.body.accessToken;

         const commentInput: CreateCommentInputDto = {
            content: 'This post helped me understand NestJS controllers.',
         };

         // Создаём комментарий под авторизованным пользователем.
         const createCommentResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(commentInput)
            .expect(201);

         const createdCommentId = createCommentResponse.body.id;

         // Автор удаляет свой комментарий.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .expect(204);

         // Проверяем, что удалённый комментарий больше не находится.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .expect(404);
      });
   });

   describe('Comment ownership', () => {
      it('forbids another user from updating or deleting a comment', async () => {
         const authorInput: CreateUserInputDto = {
            login: 'author',
            email: 'author@example.com',
            password: 'Test12345',
         };

         const otherUserInput: CreateUserInputDto = {
            login: 'otheruser',
            email: 'otheruser@example.com',
            password: 'Test12345',
         };

         // Создаём автора комментария и другого пользователя.
         await usersTestManager.createUser(authorInput);
         await usersTestManager.createUser(otherUserInput);

         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createBlogResponse.body.id,
         };

         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Получаем токен автора.
         const authorLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: authorInput.login,
               password: authorInput.password,
            })
            .expect(200);

         const authorAccessToken = authorLoginResponse.body.accessToken;

         const commentInput: CreateCommentInputDto = {
            content: 'This post helped me understand NestJS controllers.',
         };

         // Автор публикует комментарий.
         const createCommentResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(commentInput)
            .expect(201);

         const createdCommentId = createCommentResponse.body.id;

         // Получаем токен другого пользователя.
         const otherUserLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: otherUserInput.login,
               password: otherUserInput.password,
            })
            .expect(200);

         const otherUserAccessToken = otherUserLoginResponse.body.accessToken;

         const attemptedCommentUpdate: UpdateCommentInputDto = {
            content: 'Another user is trying to replace the original comment.',
         };

         // Другой пользователь пытается изменить чужой комментарий.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${otherUserAccessToken}`)
            .send(attemptedCommentUpdate)
            .expect(403);

         // Он же пытается удалить чужой комментарий.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${otherUserAccessToken}`)
            .expect(403);

         // Комментарий должен остаться доступным и неизменённым.
         const getCommentResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .expect(200);

         expect(getCommentResponse.body).toEqual(createCommentResponse.body);
      });
   });

   describe('GET /api/posts/:postId/comments', () => {
      it('returns only comments belonging to the requested post', async () => {
         const userInput: CreateUserInputDto = {
            login: 'testuser',
            email: 'testuser@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(userInput);

         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём общий блог для двух постов.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const createdBlogId = createBlogResponse.body.id;

         const firstPostInput: CreatePostInputDto = {
            title: 'NestJS controllers',
            shortDescription: 'Introduction to controllers',
            content: 'How controllers handle HTTP requests.',
            blogId: createdBlogId,
         };

         const secondPostInput: CreatePostInputDto = {
            title: 'NestJS services',
            shortDescription: 'Introduction to services',
            content: 'How services implement application logic.',
            blogId: createdBlogId,
         };

         // Создаём первый пост.
         const createFirstPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(firstPostInput)
            .expect(201);

         const firstPostId = createFirstPostResponse.body.id;

         // Создаём второй пост.
         const createSecondPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(secondPostInput)
            .expect(201);

         const secondPostId = createSecondPostResponse.body.id;

         // Получаем токен пользователя для создания комментариев.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const userAccessToken = loginResponse.body.accessToken;

         const firstPostCommentInput: CreateCommentInputDto = {
            content: 'This explanation of controllers was very helpful.',
         };

         const secondPostCommentInput: CreateCommentInputDto = {
            content: 'This explanation of services was very helpful.',
         };

         // Добавляем комментарий к первому посту и сохраняем ответ.
         const createFirstPostCommentResponse = await request(
            app.getHttpServer(),
         )
            .post(`/${GLOBAL_PREFIX}/posts/${firstPostId}/comments`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send(firstPostCommentInput)
            .expect(201);

         // Добавляем другой комментарий ко второму посту.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${secondPostId}/comments`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send(secondPostCommentInput)
            .expect(201);

         // Запрашиваем комментарии только первого поста.
         const getFirstPostCommentsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${firstPostId}/comments`)
            .expect(200);

         // Комментарий второго поста не должен попасть в результат.
         expect(getFirstPostCommentsResponse.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [createFirstPostCommentResponse.body],
         });
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
