import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { CreateCommentInputDto } from '../src/modules/bloggers-platform/comments/api/input-dto/create-comment.input-dto';
import type { UpdateLikeStatusInputDto } from '../src/modules/bloggers-platform/likes/api/input-dto/update-like-status.input-dto';
import { LikeStatus } from '../src/modules/bloggers-platform/likes/domain/like-status.enum';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import { createBlogTestData } from './helpers/blog-test-data';
import { createPostTestData } from './helpers/post-test-data';

describe('Comment likes (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
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

   describe('PUT /api/comments/:commentId/like-status', () => {
      it('allows a user to like another user comment', async () => {
         const authorInput: CreateUserInputDto = {
            login: 'author',
            email: 'author@example.com',
            password: 'Test12345',
         };

         const likerInput: CreateUserInputDto = {
            login: 'liker',
            email: 'liker@example.com',
            password: 'Test12345',
         };

         // Создаём автора комментария и пользователя, который поставит лайк.
         await usersTestManager.createUser(authorInput);
         await usersTestManager.createUser(likerInput);

         const blogInput = createBlogTestData();

         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput = createPostTestData(createBlogResponse.body.id);

         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Получаем токен автора для публикации комментария.
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

         // Получаем токен пользователя, который поставит лайк.
         const likerLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: likerInput.login,
               password: likerInput.password,
            })
            .expect(200);

         const likerAccessToken = likerLoginResponse.body.accessToken;

         const likeInput: UpdateLikeStatusInputDto = {
            likeStatus: LikeStatus.Like,
         };

         // Другой пользователь ставит лайк комментарию.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}/like-status`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .send(likeInput)
            .expect(204);

         // Читаем комментарий от имени пользователя, поставившего лайк.
         const getLikedCommentResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .expect(200);

         expect(getLikedCommentResponse.body.likesInfo).toEqual({
            likesCount: 1,
            dislikesCount: 0,
            myStatus: LikeStatus.Like,
         });
      });

      it('handles a repeated like, a change to dislike and rating removal', async () => {
         const authorInput: CreateUserInputDto = {
            login: 'author',
            email: 'author@example.com',
            password: 'Test12345',
         };

         const likerInput: CreateUserInputDto = {
            login: 'liker',
            email: 'liker@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(authorInput);
         await usersTestManager.createUser(likerInput);

         const blogInput = createBlogTestData();

         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput = createPostTestData(createBlogResponse.body.id);

         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Автор входит и публикует комментарий.
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

         const createCommentResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(commentInput)
            .expect(201);

         const createdCommentId = createCommentResponse.body.id;

         // Другой пользователь входит для оценки комментария.
         const likerLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: likerInput.login,
               password: likerInput.password,
            })
            .expect(200);

         const likerAccessToken = likerLoginResponse.body.accessToken;

         // Пользователь ставит лайк.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}/like-status`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .send({ likeStatus: LikeStatus.Like })
            .expect(204);

         // Повторно отправляет ту же оценку.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}/like-status`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .send({ likeStatus: LikeStatus.Like })
            .expect(204);

         const getCommentAfterRepeatedLikeResponse = await request(
            app.getHttpServer(),
         )
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .expect(200);

         // Повторный лайк не увеличивает счётчик.
         expect(getCommentAfterRepeatedLikeResponse.body.likesInfo).toEqual({
            likesCount: 1,
            dislikesCount: 0,
            myStatus: LikeStatus.Like,
         });

         // Пользователь заменяет лайк дизлайком.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}/like-status`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .send({ likeStatus: LikeStatus.Dislike })
            .expect(204);

         const getCommentAfterDislikeResponse = await request(
            app.getHttpServer(),
         )
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .expect(200);

         expect(getCommentAfterDislikeResponse.body.likesInfo).toEqual({
            likesCount: 0,
            dislikesCount: 1,
            myStatus: LikeStatus.Dislike,
         });

         // Пользователь снимает оценку.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}/like-status`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .send({ likeStatus: LikeStatus.None })
            .expect(204);

         const getCommentAfterRemovingRatingResponse = await request(
            app.getHttpServer(),
         )
            .get(`/${GLOBAL_PREFIX}/comments/${createdCommentId}`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .expect(200);

         expect(getCommentAfterRemovingRatingResponse.body.likesInfo).toEqual({
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatus.None,
         });
      });
   });

   describe('GET /api/posts/:postId/comments', () => {
      it('returns the viewer rating in the post comments list', async () => {
         const authorInput: CreateUserInputDto = {
            login: 'author',
            email: 'author@example.com',
            password: 'Test12345',
         };

         const likerInput: CreateUserInputDto = {
            login: 'liker',
            email: 'liker@example.com',
            password: 'Test12345',
         };

         await usersTestManager.createUser(authorInput);
         await usersTestManager.createUser(likerInput);

         const blogInput = createBlogTestData();

         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const postInput = createPostTestData(createBlogResponse.body.id);

         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Автор входит и публикует комментарий.
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

         const createCommentResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .send(commentInput)
            .expect(201);

         const createdCommentId = createCommentResponse.body.id;

         // Другой пользователь входит и ставит лайк комментарию.
         const likerLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: likerInput.login,
               password: likerInput.password,
            })
            .expect(200);

         const likerAccessToken = likerLoginResponse.body.accessToken;

         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/comments/${createdCommentId}/like-status`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .send({ likeStatus: LikeStatus.Like })
            .expect(204);

         // Получаем список от имени пользователя, поставившего лайк.
         const getCommentsAsLikerResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${likerAccessToken}`)
            .expect(200);

         expect(getCommentsAsLikerResponse.body.items).toEqual([
            {
               ...createCommentResponse.body,
               likesInfo: {
                  likesCount: 1,
                  dislikesCount: 0,
                  myStatus: LikeStatus.Like,
               },
            },
         ]);

         // Получаем тот же список от имени автора, который оценку не ставил.
         const getCommentsAsAuthorResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}/comments`)
            .set('Authorization', `Bearer ${authorAccessToken}`)
            .expect(200);

         expect(getCommentsAsAuthorResponse.body.items).toEqual([
            {
               ...createCommentResponse.body,
               likesInfo: {
                  likesCount: 1,
                  dislikesCount: 0,
                  myStatus: LikeStatus.None,
               },
            },
         ]);
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
