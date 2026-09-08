import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Blog } from '../domain/blog.entity';
import type { BlogDocument, BlogModelType } from '../domain/blog.entity';

@Injectable()
export class BlogsRepository {
   constructor(
      @InjectModel(Blog.name)
      private readonly BlogModel: BlogModelType,
   ) {}

   async findById(id: string): Promise<BlogDocument | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      return this.BlogModel.findById(id);
   }

   async save(blog: BlogDocument): Promise<void> {
      await blog.save();
   }

   async delete(blog: BlogDocument): Promise<void> {
      await blog.deleteOne();
   }
}
