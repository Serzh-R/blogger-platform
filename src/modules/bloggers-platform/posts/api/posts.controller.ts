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
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { PostViewDto } from './view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/optional-jwt-auth.guard';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { ExtractUserFromRequestOrNull } from '../../../user-accounts/guards/decorators/param/extract-user-from-request-or-null.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-status.input-dto';
import { UpdatePostLikeStatusCommand } from '../application/usecases/update-post-like-status.usecase';

@Controller('posts')
export class PostsController {
   constructor(
      private readonly commandBus: CommandBus,
      private readonly postsQueryRepository: PostsQueryRepository,
      private readonly commentsQueryRepository: CommentsQueryRepository,
   ) {}

   @Get()
   @UseGuards(OptionalJwtAuthGuard)
   async getAll(
      @Query() query: GetPostsQueryParams,
      @ExtractUserFromRequestOrNull() user: UserContextDto | null,
   ): Promise<PaginatedViewDto<PostViewDto>> {
      return this.postsQueryRepository.findAll(
         query,
         undefined,
         user?.id ?? null,
      );
   }

   @Get(':id')
   @UseGuards(OptionalJwtAuthGuard)
   async getById(
      @Param('id') id: string,
      @ExtractUserFromRequestOrNull() user: UserContextDto | null,
   ): Promise<PostViewDto> {
      const post = await this.postsQueryRepository.findById(
         id,
         user?.id ?? null,
      );

      if (!post) {
         throw new NotFoundException('Post not found');
      }

      return post;
   }

   @Get(':postId/comments')
   @UseGuards(OptionalJwtAuthGuard)
   async getComments(
      @Param('postId') postId: string,
      @Query() query: GetCommentsQueryParams,
      @ExtractUserFromRequestOrNull() user: UserContextDto | null,
   ): Promise<PaginatedViewDto<CommentViewDto>> {
      const post = await this.postsQueryRepository.findById(postId);

      if (!post) {
         throw new NotFoundException('Post not found');
      }

      return this.commentsQueryRepository.findCommentsByPostId(
         post.id,
         query,
         user?.id ?? null,
      );
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
   @UseGuards(BasicAuthGuard)
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
   @UseGuards(BasicAuthGuard)
   async updatePost(
      @Param('id') id: string,
      @Body() body: UpdatePostInputDto,
   ): Promise<void> {
      await this.commandBus.execute<UpdatePostCommand, void>(
         new UpdatePostCommand(id, body),
      );
   }

   @Put(':postId/like-status')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(JwtAuthGuard)
   async updatePostLikeStatus(
      @Param('postId') postId: string,
      @Body() body: UpdateLikeStatusInputDto,
      @ExtractUserFromRequest() user: UserContextDto,
   ): Promise<void> {
      await this.commandBus.execute<UpdatePostLikeStatusCommand, void>(
         new UpdatePostLikeStatusCommand(postId, user.id, body.likeStatus),
      );
   }

   @Delete(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(BasicAuthGuard)
   async deletePost(@Param('id') id: string): Promise<void> {
      await this.commandBus.execute<DeletePostCommand, void>(
         new DeletePostCommand(id),
      );
   }
}
