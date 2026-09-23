import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeletePostCommand {
   constructor(public readonly postId: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<
   DeletePostCommand,
   void
> {
   constructor(
      private readonly postsRepository: PostsRepository,
      private readonly commentsRepository: CommentsRepository,
      private readonly likesRepository: LikesRepository,
   ) {}

   async execute({ postId }: DeletePostCommand): Promise<void> {
      const post = await this.postsRepository.findById(postId);

      if (!post) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Post not found',
         });
      }

      const commentIds = await this.commentsRepository.findIdsByPostIds([
         postId,
      ]);

      await this.likesRepository.deleteByParentIds([postId, ...commentIds]);

      await this.commentsRepository.deleteByPostIds([postId]);

      await this.postsRepository.delete(post);
   }
}
