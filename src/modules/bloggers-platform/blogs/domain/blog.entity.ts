import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateBlogDomainDto } from './dto/create-blog.domain-dto';
import { UpdateBlogDomainDto } from './dto/update-blog.domain-dto';

@Schema({ timestamps: true })
export class Blog {
   @Prop({ type: String, required: true })
   name: string;

   @Prop({ type: String, required: true })
   description: string;

   @Prop({ type: String, required: true })
   websiteUrl: string;

   @Prop({ type: Boolean, required: true, default: false })
   isMembership: boolean;

   createdAt: Date;
   updatedAt: Date;

   static createInstance(dto: CreateBlogDomainDto): BlogDocument {
      const blog = new this();

      blog.name = dto.name;
      blog.description = dto.description;
      blog.websiteUrl = dto.websiteUrl;
      blog.isMembership = false;

      return blog as BlogDocument;
   }

   update(dto: UpdateBlogDomainDto): void {
      this.name = dto.name;
      this.description = dto.description;
      this.websiteUrl = dto.websiteUrl;
   }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<Blog> & typeof Blog;
