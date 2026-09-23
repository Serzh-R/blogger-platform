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
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { PostViewDto } from './view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';

@Controller('posts')
export class PostsController {
   constructor(
      private readonly commandBus: CommandBus,
      private readonly postsQueryRepository: PostsQueryRepository,
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

   @Post(':postId/comments')
   @UseGuards(JwtAuthGuard)
   async createComment(
      @Param('postId') postId: string,
      @Body() body: CreateCommentInputDto,
      @ExtractUserFromRequest() user: UserContextDto,
   ): Promise<CommentViewDto> {
      const commentId = await this.commandBus.execute<
         CreateCommentCommand,
         string
      >(
         new CreateCommentCommand({
            content: body.content,
            postId,
            userId: user.id,
         }),
      );

      const comment = await this.commentsQueryRepository.findById(commentId);

      if (!comment) {
         throw new InternalServerErrorException('Created comment not found');
      }

      return comment;
   }

   @Post()
   async createPost(@Body() body: CreatePostInputDto): Promise<PostViewDto> {
      const postId = await this.commandBus.execute<CreatePostCommand, string>(
         new CreatePostCommand(body),
      );

      const post = await this.postsQueryRepository.findById(postId);

      if (!post) {
         throw new InternalServerErrorException('Created post not found');
      }

      return post;
   }

   @Put(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   async updatePost(
      @Param('id') id: string,
      @Body() body: UpdatePostInputDto,
   ): Promise<void> {
      await this.commandBus.execute<UpdatePostCommand, void>(
         new UpdatePostCommand(id, body),
      );
   }

   @Delete(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   async deletePost(@Param('id') id: string): Promise<void> {
      await this.commandBus.execute<DeletePostCommand, void>(
         new DeletePostCommand(id),
      );
   }
}
