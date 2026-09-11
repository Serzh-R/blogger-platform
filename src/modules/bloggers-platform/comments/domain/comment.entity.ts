import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import type { CreateCommentDomainDto } from './dto/create-comment.domain-dto';
import type { UpdateCommentDomainDto } from './dto/update-comment.domain-dto';

@Schema({
   _id: false,
})
export class CommentatorInfo {
   @Prop({ type: String, required: true })
   userId: string;

   @Prop({ type: String, required: true })
   userLogin: string;
}

export const CommentatorInfoSchema =
   SchemaFactory.createForClass(CommentatorInfo);

@Schema({
   collection: 'comments',
   timestamps: true,
   versionKey: false,
})
export class Comment {
   @Prop({ type: String, required: true })
   content: string;

   @Prop({
      type: CommentatorInfoSchema,
      required: true,
   })
   commentatorInfo: CommentatorInfo;

   @Prop({ type: String, required: true })
   postId: string;

   @Prop({ type: Number, required: true, default: 0 })
   likesCount: number;

   @Prop({ type: Number, required: true, default: 0 })
   dislikesCount: number;

   createdAt: Date;
   updatedAt: Date;

   static createInstance(dto: CreateCommentDomainDto): CommentDocument {
      const comment = new this();

      comment.content = dto.content;
      comment.commentatorInfo = {
         userId: dto.userId,
         userLogin: dto.userLogin,
      };
      comment.postId = dto.postId;
      comment.likesCount = 0;
      comment.dislikesCount = 0;

      return comment as CommentDocument;
   }

   update(dto: UpdateCommentDomainDto): void {
      this.content = dto.content;
   }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<Comment> & typeof Comment;
