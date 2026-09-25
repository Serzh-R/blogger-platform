import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { Like } from '../../../likes/domain/like.entity';
import type { LikeModelType } from '../../../likes/domain/like.entity';
import { LikeStatus } from '../../../likes/domain/like-status.enum';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentLikeStatusCommand {
   constructor(
      public readonly commentId: string,
      public readonly userId: string,
      public readonly likeStatus: LikeStatus,
   ) {}
}

@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase implements ICommandHandler<
   UpdateCommentLikeStatusCommand,
   void
> {
   constructor(
      @InjectModel(Like.name)
      private readonly LikeModel: LikeModelType,
      private readonly commentsRepository: CommentsRepository,
      private readonly usersRepository: UsersRepository,
      private readonly likesRepository: LikesRepository,
   ) {}

   async execute({
      commentId,
      userId,
      likeStatus,
   }: UpdateCommentLikeStatusCommand): Promise<void> {
      const comment = await this.commentsRepository.findById(commentId);

      if (!comment) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Comment not found',
         });
      }

      const user = await this.usersRepository.findById(userId);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'User not found',
         });
      }

      const existingLike = await this.likesRepository.findByAuthorIdAndParentId(
         userId,
         commentId,
      );

      const previousStatus = existingLike?.status ?? LikeStatus.None;

      if (previousStatus === likeStatus) {
         return;
      }

      comment.updateLikeCounters(previousStatus, likeStatus);

      if (likeStatus === LikeStatus.None) {
         if (existingLike) {
            await this.likesRepository.delete(existingLike);
         }

         await this.commentsRepository.save(comment);

         return;
      }

      if (existingLike) {
         existingLike.updateStatus(likeStatus);

         await this.likesRepository.save(existingLike);
      } else {
         const newLike = this.LikeModel.createInstance({
            status: likeStatus,
            authorId: user._id.toString(),
            authorLogin: user.login,
            parentId: commentId,
         });

         await this.likesRepository.save(newLike);
      }

      await this.commentsRepository.save(comment);
   }
}
