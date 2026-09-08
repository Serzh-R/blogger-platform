import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsService } from './blogs/application/blogs.service';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';

@Module({
   imports: [
      MongooseModule.forFeature([
         {
            name: Blog.name,
            schema: BlogSchema,
         },
      ]),
   ],
   controllers: [BlogsController],
   providers: [BlogsService, BlogsRepository, BlogsQueryRepository],
})
export class BloggersPlatformModule {}
