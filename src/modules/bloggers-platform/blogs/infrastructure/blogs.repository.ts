import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Blog } from '../domain/blog.entity';
import type { BlogDocument, BlogModelType } from '../domain/blog.entity';
import { PostgresService } from '../../../../core/postgres.service';
import { User } from '../../../user-accounts/domain/user.entity';

@Injectable()
export class BlogsRepository {
   constructor(
      @InjectModel(Blog.name)
      private readonly BlogModel: BlogModelType,
      private readonly postgresService: PostgresService,
   ) {}

   // ************* SQL **********************************************

   async create(blog: Blog) {
      const insertBlogSql = `
      INSERT INTO blogs (name, description, website_url)
      VALUES ($1, $2, $3)
      RETURNING id
   `;

      const blogValues = [blog.name, blog.description, blog.websiteUrl];

      const insertResponse = await this.postgresService.pool.query(
         insertBlogSql,
         blogValues,
      );

      return insertResponse.rows[0].id;
   }

   // ****************************************************************

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
