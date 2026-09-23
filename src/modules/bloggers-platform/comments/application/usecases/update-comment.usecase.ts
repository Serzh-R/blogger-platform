import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentCommand {
   constructor(
      public readonly commentId: string,
      public readonly dto: UpdateCommentDto,
   ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<
   UpdateCommentCommand,
   void
> {
   constructor(private readonly commentsRepository: CommentsRepository) {}

   async execute({ commentId, dto }: UpdateCommentCommand): Promise<void> {
      const comment = await this.commentsRepository.findById(commentId);

      if (!comment) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Comment not found',
         });
      }

      if (comment.commentatorInfo.userId !== dto.userId) {
         throw new DomainException({
            code: DomainExceptionCode.Forbidden,
            message: 'Forbidden',
         });
      }

      comment.update({
         content: dto.content,
      });

      await this.commentsRepository.save(comment);
   }
}
