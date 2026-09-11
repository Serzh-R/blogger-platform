import {
   BadRequestException,
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
import { PostsService } from '../application/posts.service';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { PostViewDto } from './view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { ResultStatus } from '../../../../core/result/result.types';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
//import { CommentsService } from '../../comments/application/comments.service';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';

@Controller('posts')
export class PostsController {
   constructor(
      private readonly postsService: PostsService,
      private readonly postsQueryRepository: PostsQueryRepository,
      //private readonly commentsService: CommentsService,
      private readonly commentsQueryRepository: CommentsQueryRepository,
   ) {}

   @Get()
   async getAll(
      @Query() query: GetPostsQueryParams,
   ): Promise<PaginatedViewDto<PostViewDto>> {
      return this.postsQueryRepository.findAll(query);
   }

   @Get(':id')
   async getById(@Param('id') id: string): Promise<PostViewDto> {
      const post = await this.postsQueryRepository.findById(id);

      if (!post) {
         throw new NotFoundException('Post not found');
      }

      return post;
   }

   @Get(':postId/comments')
   async getComments(
      @Param('postId') postId: string,
      @Query() query: GetCommentsQueryParams,
   ): Promise<PaginatedViewDto<CommentViewDto>> {
      const post = await this.postsQueryRepository.findById(postId);

      if (!post) {
         throw new NotFoundException('Post not found');
      }

      return this.commentsQueryRepository.findCommentsByPostId(post.id, query);
   }

   @Post()
   async createPost(@Body() body: CreatePostInputDto): Promise<PostViewDto> {
      const result = await this.postsService.createPost(body);

      if (result.status === ResultStatus.BadRequest) {
         throw new BadRequestException({
            errorsMessages: result.extensions,
         });
      }

      if (result.status !== ResultStatus.Created || result.data === null) {
         throw new InternalServerErrorException('Failed to create post');
      }

      return PostViewDto.mapToView(result.data, []);
   }

   @Put(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   async updatePost(
      @Param('id') id: string,
      @Body() body: UpdatePostInputDto,
   ): Promise<void> {
      const result = await this.postsService.updatePost(id, body);

      if (result.status === ResultStatus.NotFound) {
         throw new NotFoundException('Post not found');
      }

      if (result.status === ResultStatus.BadRequest) {
         throw new BadRequestException({
            errorsMessages: result.extensions,
         });
      }

      if (result.status !== ResultStatus.NoContent) {
         throw new InternalServerErrorException('Failed to update post');
      }
   }

   @Delete(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   async deletePost(@Param('id') id: string): Promise<void> {
      const result = await this.postsService.deletePost(id);

      if (result.status === ResultStatus.NotFound) {
         throw new NotFoundException('Post not found');
      }

      if (result.status !== ResultStatus.NoContent) {
         throw new InternalServerErrorException('Failed to delete post');
      }
   }
}
