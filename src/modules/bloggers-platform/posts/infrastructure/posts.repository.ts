import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Post } from '../domain/post.entity';
import type { PostDocument, PostModelType } from '../domain/post.entity';

@Injectable()
export class PostsRepository {
   constructor(
      @InjectModel(Post.name)
      private readonly PostModel: PostModelType,
   ) {}

   async findById(id: string): Promise<PostDocument | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      return this.PostModel.findById(id);
   }

   async save(post: PostDocument): Promise<void> {
      await post.save();
   }

   async delete(post: PostDocument): Promise<void> {
      await post.deleteOne();
   }

   async updateBlogName(blogId: string, blogName: string): Promise<void> {
      await this.PostModel.updateMany({ blogId }, { $set: { blogName } });
   }

   async findIdsByBlogId(blogId: string): Promise<string[]> {
      const posts = await this.PostModel.find({ blogId }).select({ _id: 1 });

      return posts.map((post) => post._id.toString());
   }

   async deleteByBlogId(blogId: string): Promise<void> {
      await this.PostModel.deleteMany({ blogId });
   }
}
