import {
   Body,
   Controller,
   Delete,
   Get,
   HttpCode,
   HttpStatus,
   InternalServerErrorException,
   NotFoundException,
   Param,
   Post,
   Put,
   Query,
} from '@nestjs/common';
import { BlogsService } from '../application/blogs.service';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { ResultStatus } from '../../../../core/result/result.types';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostsService } from '../../posts/application/posts.service';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';

@Controller('blogs')
export class BlogsController {
   constructor(
      private readonly blogsService: BlogsService,
      private readonly blogsQueryRepository: BlogsQueryRepository,
      private readonly postsService: PostsService,
      private readonly postsQueryRepository: PostsQueryRepository,
   ) {}

   @Get()
   async getAll(
      @Query() query: GetBlogsQueryParams,
   ): Promise<PaginatedViewDto<BlogViewDto>> {
      return this.blogsQueryRepository.findAll(query);
   }

   @Get(':id')
   async getById(@Param('id') id: string): Promise<BlogViewDto> {
      const blog = await this.blogsQueryRepository.findById(id);

      if (!blog) {
         throw new NotFoundException('Blog not found');
      }

      return blog;
   }

   @Post()
   async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
      const result = await this.blogsService.createBlog(body);

      if (result.status !== ResultStatus.Created || result.data === null) {
         throw new InternalServerErrorException('Failed to create blog');
      }

      const blog = await this.blogsQueryRepository.findById(result.data);

      if (!blog) {
         throw new InternalServerErrorException('Created blog not found');
      }

      return blog;
   }

   @Post(':blogId/posts')
   async createPost(
      @Param('blogId') blogId: string,
      @Body() body: CreateBlogPostInputDto,
   ): Promise<PostViewDto> {
      const blog = await this.blogsQueryRepository.findById(blogId);

      if (!blog) {
         throw new NotFoundException('Blog not found');
      }

      const result = await this.postsService.createPost({
         title: body.title,
         shortDescription: body.shortDescription,
         content: body.content,
         blogId: blog.id,
      });

      if (result.status === ResultStatus.BadRequest) {
         throw new NotFoundException('Blog not found');
      }

      if (result.status !== ResultStatus.Created || result.data === null) {
         throw new InternalServerErrorException('Failed to create post');
      }

      const post = await this.postsQueryRepository.findById(result.data);

      if (!post) {
         throw new InternalServerErrorException('Created post not found');
      }

      return post;
   }

   @Put(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   async updateBlog(
      @Param('id') id: string,
      @Body() body: UpdateBlogInputDto,
   ): Promise<void> {
      const result = await this.blogsService.updateBlog(id, body);

      if (result.status === ResultStatus.NotFound) {
         throw new NotFoundException('Blog not found');
      }

      if (result.status !== ResultStatus.NoContent) {
         throw new InternalServerErrorException('Failed to update blog');
      }
   }

   @Delete(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   async deleteBlog(@Param('id') id: string): Promise<void> {
      const result = await this.blogsService.deleteBlog(id);

      if (result.status === ResultStatus.NotFound) {
         throw new NotFoundException('Blog not found');
      }

      if (result.status !== ResultStatus.NoContent) {
         throw new InternalServerErrorException('Failed to delete blog');
      }
   }
}
