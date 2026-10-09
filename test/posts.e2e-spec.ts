import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateBlogInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';
import type { CreatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/create-post.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';
import type { UpdatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/update-post.input-dto';
import type { PostViewDto } from '../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import type { CreateBlogPostInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/create-blog-post.input-dto';

describe('Posts (e2e)', () => {
   let app: INestApplication;

   beforeAll(async () => {
      const settings = await initSettings();
      app = settings.app;
   });

   beforeEach(async () => {
      await deleteAllData(app);
   });

   describe('POST /api/posts', () => {
      it('creates a post in an existing blog with valid data', async () => {
         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог, к которому будет относиться пост.
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

         // Создаём пост с авторизацией администратора.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         // Проверяем данные поста, связь с блогом и начальные значения лайков.
         expect(createPostResponse.body).toEqual({
            id: expect.any(String),
            title: postInput.title,
            shortDescription: postInput.shortDescription,
            content: postInput.content,
            blogId: createdBlogId,
            blogName: blogInput.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
               likesCount: 0,
               dislikesCount: 0,
               myStatus: 'None',
               newestLikes: [],
            },
         });
      });

      it('rejects post creation for a deleted blog', async () => {
         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог и сохраняем его ID.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const deletedBlogId = createBlogResponse.body.id;

         // Удаляем блог до отправки запроса создания поста.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/blogs/${deletedBlogId}`)
            .auth('admin', 'qwerty')
            .expect(204);

         const postInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: deletedBlogId,
         };

         // Пытаемся создать пост, используя прежний ID блога.
         const createPostErrorResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(400);

         // Сервер должен указать, что проблема связана с blogId.
         expect(createPostErrorResponse.body).toEqual({
            errorsMessages: [
               {
                  field: 'blogId',
                  message: expect.any(String),
               },
            ],
         });

         // Проверяем, что пост без существующего блога не сохранился.
         const getPostsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts`)
            .expect(200);

         expect(getPostsResponse.body.totalCount).toBe(0);
         expect(getPostsResponse.body.items).toEqual([]);
      });
   });

   describe('GET /api/posts/:id', () => {
      it('returns an existing post by id', async () => {
         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог, которому будет принадлежать пост.
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

         // Создаём пост, который затем будем запрашивать.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         // Получаем ID созданного поста из ответа сервера.
         const createdPostId = createPostResponse.body.id;

         // Запрашиваем пост по его ID без авторизации.
         const getPostResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .expect(200);

         // Проверяем, что вернулся тот же пост со всеми его полями.
         expect(getPostResponse.body).toEqual(createPostResponse.body);
      });
   });

   describe('PUT /api/posts/:id', () => {
      it('updates an existing post with valid data', async () => {
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

         const originalPostInput: CreatePostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
            blogId: createdBlogId,
         };

         // Создаём пост с исходными данными.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(originalPostInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         const updatedPostInput: UpdatePostInputDto = {
            title: 'NestJS controllers',
            shortDescription: 'How controllers handle requests',
            content: 'Controllers receive HTTP requests and return responses.',
            blogId: createdBlogId,
         };

         // Обновляем данные поста, оставляя его в том же блоге.
         await request(app.getHttpServer())
            .put(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .auth('admin', 'qwerty')
            .send(updatedPostInput)
            .expect(204);

         // Получаем пост после редактирования.
         const getUpdatedPostResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .expect(200);

         // Проверяем новые данные и сохранение остальных полей поста.
         expect(getUpdatedPostResponse.body).toEqual({
            id: createdPostId,
            title: updatedPostInput.title,
            shortDescription: updatedPostInput.shortDescription,
            content: updatedPostInput.content,
            blogId: createdBlogId,
            blogName: blogInput.name,
            createdAt: createPostResponse.body.createdAt,
            extendedLikesInfo: {
               likesCount: 0,
               dislikesCount: 0,
               myStatus: 'None',
               newestLikes: [],
            },
         });
      });
   });

   describe('DELETE /api/posts/:id', () => {
      it('deletes an existing post', async () => {
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

         // Создаём пост, который затем удалим.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         const createdPostId = createPostResponse.body.id;

         // Удаляем пост с авторизацией администратора.
         await request(app.getHttpServer())
            .delete(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .auth('admin', 'qwerty')
            .expect(204);

         // Проверяем, что удалённый пост больше не находится.
         await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts/${createdPostId}`)
            .expect(404);

         // Блог, которому принадлежал пост, продолжает существовать.
         const getBlogResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}`)
            .expect(200);

         expect(getBlogResponse.body).toEqual(createBlogResponse.body);
      });
   });

   describe('GET /api/posts', () => {
      it('returns the requested page of posts with pagination metadata', async () => {
         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём общий блог для трёх постов.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const createdBlogId = createBlogResponse.body.id;

         const postsToCreate: CreatePostInputDto[] = [
            {
               title: 'NestJS basics',
               shortDescription: 'Introduction to NestJS',
               content: 'How to get started with NestJS.',
               blogId: createdBlogId,
            },
            {
               title: 'Express basics',
               shortDescription: 'Introduction to Express',
               content: 'How to get started with Express.',
               blogId: createdBlogId,
            },
            {
               title: 'MongoDB basics',
               shortDescription: 'Introduction to MongoDB',
               content: 'How to get started with MongoDB.',
               blogId: createdBlogId,
            },
         ];

         const createdPosts: PostViewDto[] = [];

         // Создаём посты и сохраняем ответы сервера.
         for (const postInput of postsToCreate) {
            const createPostResponse = await request(app.getHttpServer())
               .post(`/${GLOBAL_PREFIX}/posts`)
               .auth('admin', 'qwerty')
               .send(postInput)
               .expect(201);

            createdPosts.push(createPostResponse.body);
         }

         // Запрашиваем вторую страницу с сортировкой по заголовку.
         const getPostsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/posts`)
            .query({
               pageNumber: 2,
               pageSize: 2,
               sortBy: 'title',
               sortDirection: 'asc',
            })
            .expect(200);

         // NestJS создан первым, но по алфавиту находится последним.
         const expectedPostOnSecondPage = createdPosts[0];

         // Проверяем содержимое страницы и общее количество постов.
         expect(getPostsResponse.body).toEqual({
            pagesCount: 2,
            page: 2,
            pageSize: 2,
            totalCount: 3,
            items: [expectedPostOnSecondPage],
         });
      });
   });

   describe('POST /api/blogs/:blogId/posts', () => {
      it('creates a post in the blog specified in the URL', async () => {
         const blogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://example.com',
         };

         // Создаём блог, в котором будем публиковать пост.
         const createBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(blogInput)
            .expect(201);

         const createdBlogId = createBlogResponse.body.id;

         // Для этого endpoint ID блога в теле запроса не нужен.
         const postInput: CreateBlogPostInputDto = {
            title: 'Getting started with NestJS',
            shortDescription: 'An introduction to NestJS',
            content: 'This post explains how to create a NestJS application.',
         };

         // Передаём ID блога в URL и создаём пост.
         const createPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs/${createdBlogId}/posts`)
            .auth('admin', 'qwerty')
            .send(postInput)
            .expect(201);

         // Проверяем, что пост связан с блогом из URL.
         expect(createPostResponse.body).toEqual({
            id: expect.any(String),
            title: postInput.title,
            shortDescription: postInput.shortDescription,
            content: postInput.content,
            blogId: createdBlogId,
            blogName: blogInput.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
               likesCount: 0,
               dislikesCount: 0,
               myStatus: 'None',
               newestLikes: [],
            },
         });
      });
   });

   describe('GET /api/blogs/:blogId/posts', () => {
      it('returns only posts belonging to the requested blog', async () => {
         const firstBlogInput: CreateBlogInputDto = {
            name: 'Backend blog',
            description: 'A blog about backend development',
            websiteUrl: 'https://backend.example.com',
         };

         const secondBlogInput: CreateBlogInputDto = {
            name: 'Frontend blog',
            description: 'A blog about frontend development',
            websiteUrl: 'https://frontend.example.com',
         };

         // Создаём первый блог.
         const createFirstBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(firstBlogInput)
            .expect(201);

         const firstBlogId = createFirstBlogResponse.body.id;

         // Создаём второй блог.
         const createSecondBlogResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs`)
            .auth('admin', 'qwerty')
            .send(secondBlogInput)
            .expect(201);

         const secondBlogId = createSecondBlogResponse.body.id;

         const firstBlogPostInput: CreateBlogPostInputDto = {
            title: 'NestJS basics',
            shortDescription: 'Introduction to NestJS',
            content: 'How to get started with NestJS.',
         };

         const secondBlogPostInput: CreateBlogPostInputDto = {
            title: 'React basics',
            shortDescription: 'Introduction to React',
            content: 'How to get started with React.',
         };

         // Создаём пост в первом блоге и сохраняем ответ сервера.
         const createFirstBlogPostResponse = await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs/${firstBlogId}/posts`)
            .auth('admin', 'qwerty')
            .send(firstBlogPostInput)
            .expect(201);

         // Создаём пост во втором блоге.
         await request(app.getHttpServer())
            .post(`/${GLOBAL_PREFIX}/blogs/${secondBlogId}/posts`)
            .auth('admin', 'qwerty')
            .send(secondBlogPostInput)
            .expect(201);

         // Запрашиваем посты только первого блога.
         const getFirstBlogPostsResponse = await request(app.getHttpServer())
            .get(`/${GLOBAL_PREFIX}/blogs/${firstBlogId}/posts`)
            .expect(200);

         // В результате должен быть только пост первого блога.
         expect(getFirstBlogPostsResponse.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [createFirstBlogPostResponse.body],
         });
      });
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
