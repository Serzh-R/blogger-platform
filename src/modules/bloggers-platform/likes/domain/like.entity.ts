import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';

@Schema({
   collection: 'likes',
   versionKey: false,
})
export class Like {
   @Prop({ type: Date, required: true })
   createdAt: Date;

   @Prop({
      type: String,
      enum: ['Like', 'Dislike'],
      required: true,
   })
   status: 'Like' | 'Dislike';

   @Prop({ type: String, required: true })
   authorId: string;

   @Prop({ type: String, required: true })
   authorLogin: string;

   @Prop({ type: String, required: true })
   parentId: string;
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

export type LikeDocument = HydratedDocument<Like>;

export type LikeModelType = Model<Like>;
