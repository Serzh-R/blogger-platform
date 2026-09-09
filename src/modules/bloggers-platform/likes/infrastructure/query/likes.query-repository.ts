import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like } from '../../domain/like.entity';
import type { LikeDocument, LikeModelType } from '../../domain/like.entity';

@Injectable()
export class LikesQueryRepository {
   constructor(
      @InjectModel(Like.name)
      private readonly LikeModel: LikeModelType,
   ) {}

   async findNewestByPostId(postId: string): Promise<LikeDocument[]> {
      return this.LikeModel.find({
         parentId: postId,
         status: 'Like',
      })
         .sort({ createdAt: -1 })
         .limit(3);
   }
}
