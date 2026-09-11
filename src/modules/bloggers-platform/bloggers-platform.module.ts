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
import { LikesRepository } from './likes/infrastructure/likes.repository';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
//import { CommentsService } from './comments/application/comments.service';
import { CommentsController } from './comments/api/comments.controller';

@Module({
   imports: [
      UserAccountsModule,

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
         {
            name: Comment.name,
            schema: CommentSchema,
         },
      ]),
   ],
   controllers: [BlogsController, PostsController, CommentsController],
   providers: [
      BlogsService,
      BlogsRepository,
      BlogsQueryRepository,
      PostsService,
      PostsRepository,
      PostsQueryRepository,
      LikesRepository,
      LikesQueryRepository,
      //CommentsService,
      CommentsRepository,
      CommentsQueryRepository,
   ],
})
export class BloggersPlatformModule {}
