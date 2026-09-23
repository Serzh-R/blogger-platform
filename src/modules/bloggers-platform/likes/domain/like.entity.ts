import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { LikeStatus } from './like-status.enum';
import type { CreateLikeDomainDto } from './dto/create-like.domain-dto';

@Schema({
   collection: 'likes',
   versionKey: false,
})
export class Like {
   @Prop({ type: Date, required: true })
   createdAt: Date;

   @Prop({
      type: String,
      enum: [LikeStatus.Like, LikeStatus.Dislike],
      required: true,
   })
   status: LikeStatus.Like | LikeStatus.Dislike;

   @Prop({ type: String, required: true })
   authorId: string;

   @Prop({ type: String, required: true })
   authorLogin: string;

   @Prop({ type: String, required: true })
   parentId: string;

   static createInstance(dto: CreateLikeDomainDto): LikeDocument {
      const like = new this();

      like.status = dto.status;
      like.authorId = dto.authorId;
      like.authorLogin = dto.authorLogin;
      like.parentId = dto.parentId;
      like.createdAt = new Date();

      return like as LikeDocument;
   }

   updateStatus(status: LikeStatus.Like | LikeStatus.Dislike): void {
      this.status = status;

      this.createdAt = new Date();
   }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index(
   {
      authorId: 1,
      parentId: 1,
   },
   {
      unique: true,
   },
);

LikeSchema.loadClass(Like);

export type LikeDocument = HydratedDocument<Like>;

export type LikeModelType = Model<Like> & typeof Like;
