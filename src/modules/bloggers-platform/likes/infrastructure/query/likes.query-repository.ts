import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like } from '../../domain/like.entity';
import type { LikeDocument, LikeModelType } from '../../domain/like.entity';
import { LikeStatus } from '../../domain/like-status.enum';

@Injectable()
export class LikesQueryRepository {
   constructor(
      @InjectModel(Like.name)
      private readonly LikeModel: LikeModelType,
   ) {}

   async findMyStatuses(
      parentIds: string[],
      userId: string | null,
   ): Promise<Map<string, LikeStatus>> {
      const myStatusesMap = new Map<string, LikeStatus>();

      for (const parentId of parentIds) {
         myStatusesMap.set(parentId, LikeStatus.None);
      }

      if (!userId || parentIds.length === 0) {
         return myStatusesMap;
      }

      const userLikes = await this.LikeModel.find({
         authorId: userId,
         parentId: {
            $in: parentIds,
         },
      });

      for (const userLike of userLikes) {
         myStatusesMap.set(userLike.parentId, userLike.status);
      }

      return myStatusesMap;
   }

   async findThreeNewestLikesByPostId(postId: string): Promise<LikeDocument[]> {
      return this.LikeModel.find<LikeDocument>({
         parentId: postId,
         status: LikeStatus.Like,
      })
         .sort({ createdAt: -1 })
         .limit(3);
   }
}
