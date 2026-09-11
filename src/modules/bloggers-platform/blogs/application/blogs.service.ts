import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from '../domain/blog.entity';
import type { BlogModelType } from '../domain/blog.entity';
import { CreateBlogDomainDto } from '../domain/dto/create-blog.domain-dto';
import { Result, ResultStatus } from '../../../../core/result/result.types';
import { UpdateBlogDomainDto } from '../domain/dto/update-blog.domain-dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { LikesRepository } from '../../likes/infrastructure/likes.repository';
import { CommentsRepository } from '../../comments/infrastructure/comments.repository';

@Injectable()
export class BlogsService {
   constructor(
      @InjectModel(Blog.name)
      private readonly BlogModel: BlogModelType,
      private readonly blogsRepository: BlogsRepository,
      private readonly postsRepository: PostsRepository,
      private readonly likesRepository: LikesRepository,
      private readonly commentsRepository: CommentsRepository,
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

      await this.postsRepository.updateBlogName(blog._id.toString(), blog.name);

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

      const blogId = blog._id.toString();

      const postIds = await this.postsRepository.findIdsByBlogId(blogId);

      const commentIds =
         await this.commentsRepository.findIdsByPostIds(postIds);

      await this.likesRepository.deleteByParentIds([...postIds, ...commentIds]);

      await this.commentsRepository.deleteByPostIds(postIds);

      await this.postsRepository.deleteByBlogId(blogId);

      await this.blogsRepository.delete(blog);

      return {
         status: ResultStatus.NoContent,
         extensions: [],
         data: null,
      };
   }
}
