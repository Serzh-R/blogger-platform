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

   async findThreeNewestLikesByPostId(postId: string): Promise<LikeDocument[]> {
      return this.LikeModel.find<LikeDocument>({
         parentId: postId,
         status: LikeStatus.Like,
      })
         .sort({ createdAt: -1 })
         .limit(3);
   }
}
