import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateBlogInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';
import type { CreatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/create-post.input-dto';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { deleteAllData } from './helpers/delete-all-data';
import { initSettings } from './helpers/init-settings';

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
   });

   afterAll(async () => {
      if (app) {
         await app.close();
      }
   });
});
