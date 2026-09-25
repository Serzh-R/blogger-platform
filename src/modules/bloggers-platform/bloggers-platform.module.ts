import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { Like, LikeSchema } from './likes/domain/like.entity';
import { LikesQueryRepository } from './likes/infrastructure/query/likes.query-repository';
import { PostsQueryRepository } from './posts/infrastructure/query/posts.query-repository';
import { PostsController } from './posts/api/posts.controller';
import { LikesRepository } from './likes/infrastructure/likes.repository';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CommentsController } from './comments/api/comments.controller';
import { CreateBlogUseCase } from './blogs/application/usecases/create-blog.usecase';
import { UpdateBlogUseCase } from './blogs/application/usecases/update-blog.usecase';
import { DeleteBlogUseCase } from './blogs/application/usecases/delete-blog.usecase';
import { CreatePostUseCase } from './posts/application/usecases/create-post.usecase';
import { UpdatePostUseCase } from './posts/application/usecases/update-post.usecase';
import { DeletePostUseCase } from './posts/application/usecases/delete-post.usecase';
import { CreateCommentUseCase } from './comments/application/usecases/create-comment.usecase';
import { PassportModule } from '@nestjs/passport';
import { UpdateCommentUseCase } from './comments/application/usecases/update-comment.usecase';
import { DeleteCommentUseCase } from './comments/application/usecases/delete-comment.usecase';
import { UpdatePostLikeStatusUseCase } from './posts/application/usecases/update-post-like-status.usecase';
import { UpdateCommentLikeStatusUseCase } from './comments/application/usecases/update-comment-like-status.usecase';

@Module({
   imports: [
      PassportModule.register({
         session: false,
      }),
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
      BlogsRepository,
      BlogsQueryRepository,
      PostsRepository,
      PostsQueryRepository,
      LikesRepository,
      LikesQueryRepository,
      CommentsRepository,
      CommentsQueryRepository,

      CreateBlogUseCase,
      UpdateBlogUseCase,
      DeleteBlogUseCase,
      CreatePostUseCase,
      UpdatePostUseCase,
      DeletePostUseCase,
      CreateCommentUseCase,
      UpdateCommentUseCase,
      DeleteCommentUseCase,
      UpdatePostLikeStatusUseCase,
      UpdateCommentLikeStatusUseCase,
   ],
})
export class BloggersPlatformModule {}
