import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentViewDto } from './view-dto/comment.view-dto';

@Controller('comments')
export class CommentsController {
   constructor(
      private readonly commentsQueryRepository: CommentsQueryRepository,
   ) {}

   @Get(':id')
   async getById(@Param('id') id: string): Promise<CommentViewDto> {
      const comment = await this.commentsQueryRepository.findById(id);

      if (!comment) {
         throw new NotFoundException('Comment not found');
      }

      return comment;
   }
}
