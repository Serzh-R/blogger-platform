import type { CommentDocument } from '../../domain/comment.entity';
import { LikeStatus } from '../../../likes/domain/like-status.enum';

export class CommentatorInfoViewDto {
   userId: string;
   userLogin: string;
}

export class LikesInfoViewDto {
   likesCount: number;
   dislikesCount: number;
   myStatus: LikeStatus;
}

export class CommentViewDto {
   id: string;
   content: string;
   commentatorInfo: CommentatorInfoViewDto;
   createdAt: string;
   likesInfo: LikesInfoViewDto;

   static mapToView(
      comment: CommentDocument,
      myStatus: LikeStatus = LikeStatus.None,
   ): CommentViewDto {
      const dto = new CommentViewDto();

      dto.id = comment._id.toString();
      dto.content = comment.content;
      dto.commentatorInfo = {
         userId: comment.commentatorInfo.userId,
         userLogin: comment.commentatorInfo.userLogin,
      };
      dto.createdAt = comment.createdAt.toISOString();

      dto.likesInfo = {
         likesCount: comment.likesCount,
         dislikesCount: comment.dislikesCount,
         myStatus,
      };

      return dto;
   }
}
