import {
   Body,
   Controller,
   Delete,
   Get,
   HttpCode,
   HttpStatus,
   NotFoundException,
   Param,
   Put,
   UseGuards,
} from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentViewDto } from './view-dto/comment.view-dto';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { UpdateCommentInputDto } from './input-dto/update-comment.input-dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecase';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-status.input-dto';
import { UpdateCommentLikeStatusCommand } from '../application/usecases/update-comment-like-status.usecase';
import { OptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/optional-jwt-auth.guard';
import { ExtractUserFromRequestOrNull } from '../../../user-accounts/guards/decorators/param/extract-user-from-request-or-null.decorator';

@Controller('comments')
export class CommentsController {
   constructor(
      private readonly commandBus: CommandBus,
      private readonly commentsQueryRepository: CommentsQueryRepository,
   ) {}

   @Get(':id')
   @UseGuards(OptionalJwtAuthGuard)
   async getById(
      @Param('id') id: string,
      @ExtractUserFromRequestOrNull() user: UserContextDto | null,
   ): Promise<CommentViewDto> {
      const comment = await this.commentsQueryRepository.findById(
         id,
         user?.id ?? null,
      );

      if (!comment) {
         throw new NotFoundException('Comment not found');
      }

      return comment;
   }

   @Put(':commentId')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(JwtAuthGuard)
   async updateComment(
      @Param('commentId') commentId: string,
      @Body() body: UpdateCommentInputDto,
      @ExtractUserFromRequest() user: UserContextDto,
   ): Promise<void> {
      await this.commandBus.execute<UpdateCommentCommand, void>(
         new UpdateCommentCommand(commentId, {
            content: body.content,
            userId: user.id,
         }),
      );
   }

   @Put(':commentId/like-status')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(JwtAuthGuard)
   async updateCommentLikeStatus(
      @Param('commentId') commentId: string,
      @Body() body: UpdateLikeStatusInputDto,
      @ExtractUserFromRequest() user: UserContextDto,
   ): Promise<void> {
      await this.commandBus.execute<UpdateCommentLikeStatusCommand, void>(
         new UpdateCommentLikeStatusCommand(
            commentId,
            user.id,
            body.likeStatus,
         ),
      );
   }

   @Delete(':commentId')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(JwtAuthGuard)
   async deleteComment(
      @Param('commentId') commentId: string,
      @ExtractUserFromRequest() user: UserContextDto,
   ): Promise<void> {
      await this.commandBus.execute<DeleteCommentCommand, void>(
         new DeleteCommentCommand(commentId, user.id),
      );
   }
}
