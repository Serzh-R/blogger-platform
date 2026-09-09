import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import type { CreatePostDomainDto } from './dto/create-post.domain-dto';
import { UpdatePostDomainDto } from './dto/update-post.domain-dto';

@Schema({
   collection: 'posts',
   timestamps: true,
   versionKey: false,
})
export class Post {
   @Prop({ type: String, required: true })
   title: string;

   @Prop({ type: String, required: true })
   shortDescription: string;

   @Prop({ type: String, required: true })
   content: string;

   @Prop({ type: String, required: true })
   blogId: string;

   @Prop({ type: String, required: true })
   blogName: string;

   @Prop({ type: Number, required: true, default: 0 })
   likesCount: number;

   @Prop({ type: Number, required: true, default: 0 })
   dislikesCount: number;

   createdAt: Date;
   updatedAt: Date;

   static createInstance(dto: CreatePostDomainDto): PostDocument {
      const post = new this();

      post.title = dto.title;
      post.shortDescription = dto.shortDescription;
      post.content = dto.content;
      post.blogId = dto.blogId;
      post.blogName = dto.blogName;
      post.likesCount = 0;
      post.dislikesCount = 0;

      return post as PostDocument;
   }

   update(dto: UpdatePostDomainDto): void {
      this.title = dto.title;
      this.shortDescription = dto.shortDescription;
      this.content = dto.content;
      this.blogId = dto.blogId;
      this.blogName = dto.blogName;
   }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<Post> & typeof Post;
