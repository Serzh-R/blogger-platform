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
   UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { OptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/optional-jwt-auth.guard';
import { ExtractUserFromRequestOrNull } from '../../../user-accounts/guards/decorators/param/extract-user-from-request-or-null.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';

@Controller('blogs')
export class BlogsController {
   constructor(
      private readonly commandBus: CommandBus,
      private readonly blogsQueryRepository: BlogsQueryRepository,
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

   @Get(':blogId/posts')
   @UseGuards(OptionalJwtAuthGuard)
   async getPosts(
      @Param('blogId') blogId: string,
      @Query() query: GetPostsQueryParams,
      @ExtractUserFromRequestOrNull() user: UserContextDto | null,
   ): Promise<PaginatedViewDto<PostViewDto>> {
      const blog = await this.blogsQueryRepository.findById(blogId);

      if (!blog) {
         throw new NotFoundException('Blog not found');
      }

      return this.postsQueryRepository.findAll(
         query,
         blog.id,
         user?.id ?? null,
      );
   }

   @Post()
   @UseGuards(BasicAuthGuard)
   async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
      const blogId = await this.commandBus.execute<CreateBlogCommand, string>(
         new CreateBlogCommand(body),
      );

      const blog = await this.blogsQueryRepository.findById(blogId);

      if (!blog) {
         throw new InternalServerErrorException('Created blog not found');
      }

      return blog;
   }

   @Post(':blogId/posts')
   @UseGuards(BasicAuthGuard)
   async createPost(
      @Param('blogId') blogId: string,
      @Body() body: CreateBlogPostInputDto,
   ): Promise<PostViewDto> {
      const blog = await this.blogsQueryRepository.findById(blogId);

      if (!blog) {
         throw new NotFoundException('Blog not found');
      }

      const postId = await this.commandBus.execute<CreatePostCommand, string>(
         new CreatePostCommand({
            title: body.title,
            shortDescription: body.shortDescription,
            content: body.content,
            blogId: blog.id,
         }),
      );

      const post = await this.postsQueryRepository.findById(postId);

      if (!post) {
         throw new InternalServerErrorException('Created post not found');
      }

      return post;
   }

   @Put(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(BasicAuthGuard)
   async updateBlog(
      @Param('id') id: string,
      @Body() body: UpdateBlogInputDto,
   ): Promise<void> {
      await this.commandBus.execute<UpdateBlogCommand, void>(
         new UpdateBlogCommand(id, body),
      );
   }

   @Delete(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(BasicAuthGuard)
   async deleteBlog(@Param('id') id: string): Promise<void> {
      await this.commandBus.execute<DeleteBlogCommand, void>(
         new DeleteBlogCommand(id),
      );
   }
}
