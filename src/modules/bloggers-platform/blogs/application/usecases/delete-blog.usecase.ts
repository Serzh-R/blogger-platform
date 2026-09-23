import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteBlogCommand {
   constructor(public readonly blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<
   DeleteBlogCommand,
   void
> {
   constructor(
      private readonly blogsRepository: BlogsRepository,
      private readonly postsRepository: PostsRepository,
      private readonly commentsRepository: CommentsRepository,
      private readonly likesRepository: LikesRepository,
   ) {}

   async execute({ blogId }: DeleteBlogCommand): Promise<void> {
      const blog = await this.blogsRepository.findById(blogId);

      if (!blog) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Blog not found',
         });
      }

      const postIds = await this.postsRepository.findIdsByBlogId(blogId);

      const commentIds =
         await this.commentsRepository.findIdsByPostIds(postIds);

      await this.likesRepository.deleteByParentIds([...postIds, ...commentIds]);

      await this.commentsRepository.deleteByPostIds(postIds);

      await this.postsRepository.deleteByBlogId(blogId);

      await this.blogsRepository.delete(blog);
   }
}
