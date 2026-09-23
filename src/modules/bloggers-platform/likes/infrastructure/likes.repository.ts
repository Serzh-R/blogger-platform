import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like } from '../domain/like.entity';
import type { LikeDocument, LikeModelType } from '../domain/like.entity';

@Injectable()
export class LikesRepository {
   constructor(
      @InjectModel(Like.name)
      private readonly LikeModel: LikeModelType,
   ) {}

   async findByAuthorIdAndParentId(
      authorId: string,
      parentId: string,
   ): Promise<LikeDocument | null> {
      return this.LikeModel.findOne({
         authorId,
         parentId,
      });
   }

   async save(like: LikeDocument): Promise<void> {
      await like.save();
   }

   async delete(like: LikeDocument): Promise<void> {
      await like.deleteOne();
   }

   async deleteByParentIds(parentIds: string[]): Promise<void> {
      await this.LikeModel.deleteMany({
         parentId: { $in: parentIds },
      });
   }
}
