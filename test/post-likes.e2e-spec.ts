import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { CreateBlogInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';
import type { UpdateLikeStatusInputDto } from '../src/modules/bloggers-platform/likes/api/input-dto/update-like-status.input-dto';
import { LikeStatus } from '../src/modules/bloggers-platform/likes/domain/like-status.enum';
import type { CreatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/create-post.input-dto';
import type { CreateUserInputDto } from '../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import type { UserViewDto } from '../src/modules/user-accounts/api/view-dto/user.view-dto';

describe('Post likes (e2e)', () => {
   let app: INestApplication;
   let usersTestManager: UsersTestManager;

   beforeAll(async () => {
      // Используем знакомую подмену ограничения запросов.
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

   describe('PUT /api/posts/:postId/like-status', () => {
      it('adds a like and returns the user status and newest like', async () => {
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

         // Входим под созданным пользователем.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const userAccessToken = loginResponse.body.accessToken;

         const likeInput: UpdateLikeStatusInputDto = {
            likeStatus: LikeStatus.Like,
         };

         // Ставим лайк от имени авторизованного пользователя.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send(likeInput)
            .expect(204);

         // Получаем пост от имени того же пользователя.
         const getPostResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .expect(200);

         // Проверяем счётчики, личную оценку и автора последнего лайка.
         expect(getPostResponse.body.extendedLikesInfo).toEqual({
            likesCount: 1,
            dislikesCount: 0,
            myStatus: LikeStatus.Like,
            newestLikes: [
               {
                  addedAt: expect.any(String),
                  userId: createdUser.id,
                  login: createdUser.login,
               },
            ],
         });
      });

      it('changes a like to a dislike and then removes the rating', async () => {
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

         // Получаем access токен пользователя.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const userAccessToken = loginResponse.body.accessToken;

         // Сначала пользователь ставит лайк.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({ likeStatus: LikeStatus.Like })
            .expect(204);

         // Затем меняет свою оценку на дизлайк.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({ likeStatus: LikeStatus.Dislike })
            .expect(204);

         const getPostAfterDislikeResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .expect(200);

         // Прежний лайк убран, появился дизлайк.
         expect(getPostAfterDislikeResponse.body.extendedLikesInfo).toEqual({
            likesCount: 0,
            dislikesCount: 1,
            myStatus: LikeStatus.Dislike,
            newestLikes: [],
         });

         // Пользователь снимает свою оценку.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({ likeStatus: LikeStatus.None })
            .expect(204);

         const getPostAfterRemovingRatingResponse = await request(
            app.getHttpServer(),
         )
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .expect(200);

         // После снятия оценки оба счётчика равны нулю.
         expect(
            getPostAfterRemovingRatingResponse.body.extendedLikesInfo,
         ).toEqual({
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatus.None,
            newestLikes: [],
         });
      });

      it('does not count the same user like twice', async () => {
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

         // Создаём пост для оценки.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Получаем токен пользователя.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const userAccessToken = loginResponse.body.accessToken;

         const likeInput: UpdateLikeStatusInputDto = {
            likeStatus: LikeStatus.Like,
         };

         // Пользователь ставит лайк.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send(likeInput)
            .expect(204);

         // Повторно отправляет тот же статус для того же поста.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send(likeInput)
            .expect(204);

         // Получаем итоговую информацию о лайках.
         const getPostResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .expect(200);

         // Повторный запрос не должен увеличить счётчик или добавить второй лайк.
         expect(getPostResponse.body.extendedLikesInfo).toEqual({
            likesCount: 1,
            dislikesCount: 0,
            myStatus: LikeStatus.Like,
            newestLikes: [
               {
                  addedAt: expect.any(String),
                  userId: createdUser.id,
                  login: createdUser.login,
               },
            ],
         });
      });

      it('returns shared counters and the current viewer rating', async () => {
         const likeUserInput: CreateUserInputDto = {
            login: 'liker',
            email: 'likeuser@example.com',
            password: 'Test12345',
         };

         const dislikeUserInput: CreateUserInputDto = {
            login: 'disliker',
            email: 'dislikeuser@example.com',
            password: 'Test12345',
         };

         // Создаём двух пользователей с разными будущими оценками.
         const likeUser = await usersTestManager.createUser(likeUserInput);
         await usersTestManager.createUser(dislikeUserInput);

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

         // Получаем токен пользователя, который поставит лайк.
         const likeUserLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: likeUserInput.login,
               password: likeUserInput.password,
            })
            .expect(200);

         const likeUserAccessToken = likeUserLoginResponse.body.accessToken;

         // Получаем токен пользователя, который поставит дизлайк.
         const dislikeUserLoginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: dislikeUserInput.login,
               password: dislikeUserInput.password,
            })
            .expect(200);

         const dislikeUserAccessToken =
            dislikeUserLoginResponse.body.accessToken;

         // Первый пользователь ставит лайк.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${likeUserAccessToken}`)
            .send({ likeStatus: LikeStatus.Like })
            .expect(204);

         // Второй пользователь ставит дизлайк.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${dislikeUserAccessToken}`)
            .send({ likeStatus: LikeStatus.Dislike })
            .expect(204);

         // В последних лайках ожидаем только пользователя с оценкой Like.
         const expectedNewestLikes = [
            {
               addedAt: expect.any(String),
               userId: likeUser.id,
               login: likeUser.login,
            },
         ];

         // Получаем пост от имени пользователя, поставившего лайк.
         const getPostAsLikeUserResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .set('Authorization', `Bearer ${likeUserAccessToken}`)
            .expect(200);

         expect(getPostAsLikeUserResponse.body.extendedLikesInfo).toEqual({
            likesCount: 1,
            dislikesCount: 1,
            myStatus: LikeStatus.Like,
            newestLikes: expectedNewestLikes,
         });

         // Получаем тот же пост от имени пользователя, поставившего дизлайк.
         const getPostAsDislikeUserResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .set('Authorization', `Bearer ${dislikeUserAccessToken}`)
            .expect(200);

         expect(getPostAsDislikeUserResponse.body.extendedLikesInfo).toEqual({
            likesCount: 1,
            dislikesCount: 1,
            myStatus: LikeStatus.Dislike,
            newestLikes: expectedNewestLikes,
         });

         // Получаем пост без авторизации.
         const getPostAsGuestResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .expect(200);

         expect(getPostAsGuestResponse.body.extendedLikesInfo).toEqual({
            likesCount: 1,
            dislikesCount: 1,
            myStatus: LikeStatus.None,
            newestLikes: expectedNewestLikes,
         });
      });

      it('returns only the three newest likes in descending date order', async () => {
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
         const usersWhoLiked: UserViewDto[] = [];

         // Четыре разных пользователя последовательно ставят лайк.
         for (let userNumber = 1; userNumber <= 4; userNumber += 1) {
            const userInput: CreateUserInputDto = {
               login: `liker${userNumber}`,
               email: `liker${userNumber}@example.com`,
               password: 'Test12345',
            };

            const createdUser = await usersTestManager.createUser(userInput);
            usersWhoLiked.push(createdUser);

            const loginResponse = await request(app.getHttpServer())
               .post(`/${GLOBAL_PREFIX}/auth/login`)
               .send({
                  loginOrEmail: userInput.login,
                  password: userInput.password,
               })
               .expect(200);

            const userAccessToken = loginResponse.body.accessToken;

            await request(app.getHttpServer())
               .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
               .set('Authorization', `Bearer ${userAccessToken}`)
               .send({ likeStatus: LikeStatus.Like })
               .expect(204);

            // Разделяем время лайков, чтобы порядок по дате был однозначным.
            await new Promise((resolve) => setTimeout(resolve, 10));
         }

         // Последними поставили лайк четвёртый, третий и второй пользователи.
         const expectedNewestLikes = [
            usersWhoLiked[3],
            usersWhoLiked[2],
            usersWhoLiked[1],
         ].map((user) => ({
            addedAt: expect.any(String),
            userId: user.id,
            login: user.login,
         }));

         // Получаем пост без авторизации.
         const getPostResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .expect(200);

         // Всего четыре лайка, но в списке только три последних.
         expect(getPostResponse.body.extendedLikesInfo).toEqual({
            likesCount: 4,
            dislikesCount: 0,
            myStatus: LikeStatus.None,
            newestLikes: expectedNewestLikes,
         });
      });
   });

   describe('Post lists with likes', () => {
      it('returns the updated likes in the feed and the blog post list', async () => {
         const userInput: CreateUserInputDto = {
            login: 'liker',
            email: 'liker@example.com',
            password: 'Test12345',
         };

         const createdUser = await usersTestManager.createUser(userInput);

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

         const createdBlogId = createBlogResponse.body.id;

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createdBlogId,
         };

         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Получаем токен пользователя и ставим лайк.
         const loginResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/auth/login`)
            .send({
               loginOrEmail: userInput.login,
               password: userInput.password,
            })
            .expect(200);

         const userAccessToken = loginResponse.body.accessToken;

         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({ likeStatus: LikeStatus.Like })
            .expect(204);

         // Формируем ожидаемый пост с обновлённой информацией о лайках.
         const expectedPostWithLike = {
            ...createPostResponse.body,
            extendedLikesInfo: {
               likesCount: 1,
               dislikesCount: 0,
               myStatus: LikeStatus.Like,
               newestLikes: [
                  {
                     addedAt: expect.any(String),
                     userId: createdUser.id,
                     login: createdUser.login,
                  },
               ],
            },
         };

         // Пользователь открывает общую ленту постов.
         const getPostsFeedResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .expect(200);

         expect(getPostsFeedResponse.body.items).toEqual([
            expectedPostWithLike,
         ]);

         // Затем открывает список постов конкретного блога.
         const getBlogPostsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}/posts`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .expect(200);

         expect(getBlogPostsResponse.body.items).toEqual([
            expectedPostWithLike,
         ]);
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
