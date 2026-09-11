import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like } from '../domain/like.entity';
import type { LikeModelType } from '../domain/like.entity';

@Injectable()
export class LikesRepository {
   constructor(
      @InjectModel(Like.name)
      private readonly LikeModel: LikeModelType,
   ) {}

   async deleteByParentIds(parentIds: string[]): Promise<void> {
      await this.LikeModel.deleteMany({
         parentId: { $in: parentIds },
      });
   }
}
