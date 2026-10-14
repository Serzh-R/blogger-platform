import type { CreateBlogPostInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/create-blog-post.input-dto';
import type { CreatePostInputDto } from '../../src/modules/bloggers-platform/posts/api/input-dto/create-post.input-dto';

export const createBlogPostTestData = (): CreateBlogPostInputDto => {
   // Данные для создания поста, когда ID блога передаётся в URL.
   return {
      title: 'Getting started with NestJS',
      shortDescription: 'An introduction to NestJS',
      content: 'This post explains how to create a NestJS application.',
   };
};

export const createPostTestData = (blogId: string): CreatePostInputDto => {
   // Используем те же текстовые поля и добавляем ID блога в тело запроса.
   return {
      ...createBlogPostTestData(),
      blogId,
   };
};
