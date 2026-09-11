import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Comment } from '../domain/comment.entity';
import type {
   CommentDocument,
   CommentModelType,
} from '../domain/comment.entity';

@Injectable()
export class CommentsRepository {
   constructor(
      @InjectModel(Comment.name)
      private readonly CommentModel: CommentModelType,
   ) {}

   async findById(id: string): Promise<CommentDocument | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      return this.CommentModel.findById(id);
   }

   async findIdsByPostIds(postIds: string[]): Promise<string[]> {
      const comments = await this.CommentModel.find({
         postId: { $in: postIds },
      }).select({ _id: 1 });

      return comments.map((comment) => comment._id.toString());
   }

   async deleteByPostIds(postIds: string[]): Promise<void> {
      await this.CommentModel.deleteMany({
         postId: { $in: postIds },
      });
   }

   async save(comment: CommentDocument): Promise<void> {
      await comment.save();
   }

   async delete(comment: CommentDocument): Promise<void> {
      await comment.deleteOne();
   }
}
