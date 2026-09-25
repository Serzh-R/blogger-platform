import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { Like } from '../../../likes/domain/like.entity';
import type { LikeModelType } from '../../../likes/domain/like.entity';
import { LikeStatus } from '../../../likes/domain/like-status.enum';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdatePostLikeStatusCommand {
   constructor(
      public readonly postId: string,
      public readonly userId: string,
      public readonly likeStatus: LikeStatus,
   ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase implements ICommandHandler<
   UpdatePostLikeStatusCommand,
   void
> {
   constructor(
      @InjectModel(Like.name)
      private readonly LikeModel: LikeModelType,
      private readonly postsRepository: PostsRepository,
      private readonly usersRepository: UsersRepository,
      private readonly likesRepository: LikesRepository,
   ) {}

   async execute({
      postId,
      userId,
      likeStatus,
   }: UpdatePostLikeStatusCommand): Promise<void> {
      const post = await this.postsRepository.findById(postId);

      if (!post) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Post not found',
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
         postId,
      );

      const previousStatus = existingLike?.status ?? LikeStatus.None;

      if (previousStatus === likeStatus) {
         return;
      }

      post.updateLikeCounters(previousStatus, likeStatus);

      if (likeStatus === LikeStatus.None) {
         if (existingLike) {
            await this.likesRepository.delete(existingLike);
         }

         await this.postsRepository.save(post);

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
            parentId: postId,
         });

         await this.likesRepository.save(newLike);
      }

      await this.postsRepository.save(post);
   }
}
