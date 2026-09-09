import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { Post } from '../domain/post.entity';
import type { PostModelType } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { Result, ResultStatus } from '../../../../core/result/result.types';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
   constructor(
      @InjectModel(Post.name)
      private readonly PostModel: PostModelType,
      private readonly postsRepository: PostsRepository,
      private readonly blogsRepository: BlogsRepository,
   ) {}

   async createPost(dto: CreatePostDto): Promise<Result<string>> {
      const blog = await this.blogsRepository.findById(dto.blogId);

      if (!blog) {
         return {
            status: ResultStatus.BadRequest,
            errorMessage: 'Blog not found',
            extensions: [
               {
                  field: 'blogId',
                  message: 'Blog not found',
               },
            ],
            data: null,
         };
      }

      const post = this.PostModel.createInstance({
         title: dto.title,
         shortDescription: dto.shortDescription,
         content: dto.content,
         blogId: blog._id.toString(),
         blogName: blog.name,
      });

      await this.postsRepository.save(post);

      return {
         status: ResultStatus.Created,
         extensions: [],
         data: post._id.toString(),
      };
   }

   async updatePost(id: string, dto: UpdatePostDto): Promise<Result> {
      const post = await this.postsRepository.findById(id);

      if (!post) {
         return {
            status: ResultStatus.NotFound,
            errorMessage: 'Post not found',
            extensions: [],
            data: null,
         };
      }

      const blog = await this.blogsRepository.findById(dto.blogId);

      if (!blog) {
         return {
            status: ResultStatus.BadRequest,
            errorMessage: 'Blog not found',
            extensions: [
               {
                  field: 'blogId',
                  message: 'Blog not found',
               },
            ],
            data: null,
         };
      }

      post.update({
         title: dto.title,
         shortDescription: dto.shortDescription,
         content: dto.content,
         blogId: blog._id.toString(),
         blogName: blog.name,
      });

      await this.postsRepository.save(post);

      return {
         status: ResultStatus.NoContent,
         extensions: [],
         data: null,
      };
   }

   async deletePost(id: string): Promise<Result> {
      const post = await this.postsRepository.findById(id);

      if (!post) {
         return {
            status: ResultStatus.NotFound,
            errorMessage: 'Post not found',
            extensions: [],
            data: null,
         };
      }

      await this.postsRepository.delete(post);

      return {
         status: ResultStatus.NoContent,
         extensions: [],
         data: null,
      };
   }
}
