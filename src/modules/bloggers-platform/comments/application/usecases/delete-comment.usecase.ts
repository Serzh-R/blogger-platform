import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteCommentCommand {
   constructor(
      public readonly commentId: string,
      public readonly userId: string,
   ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase implements ICommandHandler<
   DeleteCommentCommand,
   void
> {
   constructor(
      private readonly commentsRepository: CommentsRepository,
      private readonly likesRepository: LikesRepository,
   ) {}

   async execute({ commentId, userId }: DeleteCommentCommand): Promise<void> {
      const comment = await this.commentsRepository.findById(commentId);

      if (!comment) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Comment not found',
         });
      }

      if (comment.commentatorInfo.userId !== userId) {
         throw new DomainException({
            code: DomainExceptionCode.Forbidden,
            message: 'Forbidden',
         });
      }

      await this.commentsRepository.delete(comment);

      await this.likesRepository.deleteByParentIds([commentId]);
   }
}
