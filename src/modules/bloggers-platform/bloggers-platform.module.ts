import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsService } from './blogs/application/blogs.service';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsService } from './posts/application/posts.service';
import { Like, LikeSchema } from './likes/domain/like.entity';
import { LikesQueryRepository } from './likes/infrastructure/query/likes.query-repository';
import { PostsQueryRepository } from './posts/infrastructure/query/posts.query-repository';
import { PostsController } from './posts/api/posts.controller';

@Module({
   imports: [
      MongooseModule.forFeature([
         {
            name: Blog.name,
            schema: BlogSchema,
         },
         {
            name: Post.name,
            schema: PostSchema,
         },
         {
            name: Like.name,
            schema: LikeSchema,
         },
      ]),
   ],
   controllers: [BlogsController, PostsController],
   providers: [
      BlogsService,
      BlogsRepository,
      BlogsQueryRepository,
      PostsService,
      PostsRepository,
      PostsQueryRepository,
      LikesQueryRepository,
   ],
})
export class BloggersPlatformModule {}
