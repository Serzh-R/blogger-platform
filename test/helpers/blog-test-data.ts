import type { CreateBlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';

export const createBlogTestData = (
   customData: Partial<CreateBlogInputDto> = {},
): CreateBlogInputDto => {
   // Каждый вызов возвращает новый объект с данными блога.
   return {
      name: 'Backend blog',
      description: 'A blog about backend development',
      websiteUrl: 'https://example.com',

      // Переданные поля заменяют стандартные значения.
      ...customData,
   };
};
