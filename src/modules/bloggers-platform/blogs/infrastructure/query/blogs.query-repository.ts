import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Types } from 'mongoose';
import { Blog } from '../../domain/blog.entity';
import type { BlogModelType } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';

@Injectable()
export class BlogsQueryRepository {
   constructor(
      @InjectModel(Blog.name)
      private readonly BlogModel: BlogModelType,
   ) {}

   async findById(id: string): Promise<BlogViewDto | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      const blog = await this.BlogModel.findById(id);

      if (!blog) {
         return null;
      }

      return BlogViewDto.mapToView(blog);
   }

   async findAll(
      query: GetBlogsQueryParams,
   ): Promise<PaginatedViewDto<BlogViewDto>> {
      const filter: QueryFilter<Blog> = {};

      if (query.searchNameTerm) {
         filter.name = {
            $regex: query.searchNameTerm,
            $options: 'i',
         };
      }

      const totalCount = await this.BlogModel.countDocuments(filter);

      const blogs = await this.BlogModel.find(filter)
         .sort({ [query.sortBy]: query.sortDirection })
         .skip(query.calculateSkip())
         .limit(query.pageSize);

      return PaginatedViewDto.mapToView({
         items: blogs.map((blog) => BlogViewDto.mapToView(blog)),
         page: query.pageNumber,
         pageSize: query.pageSize,
         totalCount,
      });
   }
}
