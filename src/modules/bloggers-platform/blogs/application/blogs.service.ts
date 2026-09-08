import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from '../domain/blog.entity';
import type { BlogModelType } from '../domain/blog.entity';
import { CreateBlogDomainDto } from '../domain/dto/create-blog.domain-dto';
import { Result, ResultStatus } from '../../../../core/result/result.types';
import { UpdateBlogDomainDto } from '../domain/dto/update-blog.domain-dto';

@Injectable()
export class BlogsService {
   constructor(
      @InjectModel(Blog.name)
      private readonly BlogModel: BlogModelType,
      private readonly blogsRepository: BlogsRepository,
   ) {}

   async createBlog(dto: CreateBlogDomainDto): Promise<Result<string>> {
      const blog = this.BlogModel.createInstance(dto);

      await this.blogsRepository.save(blog);

      return {
         status: ResultStatus.Created,
         data: blog._id.toString(),
         extensions: [],
      };
   }

   async updateBlog(id: string, dto: UpdateBlogDomainDto): Promise<Result> {
      const blog = await this.blogsRepository.findById(id);

      if (!blog) {
         return {
            status: ResultStatus.NotFound,
            errorMessage: 'Blog not found',
            extensions: [],
            data: null,
         };
      }

      blog.update(dto);

      await this.blogsRepository.save(blog);

      return {
         status: ResultStatus.NoContent,
         extensions: [],
         data: null,
      };
   }

   async deleteBlog(id: string): Promise<Result> {
      const blog = await this.blogsRepository.findById(id);

      if (!blog) {
         return {
            status: ResultStatus.NotFound,
            errorMessage: 'Blog not found',
            extensions: [],
            data: null,
         };
      }

      await this.blogsRepository.delete(blog);

      return {
         status: ResultStatus.NoContent,
         extensions: [],
         data: null,
      };
   }
}
