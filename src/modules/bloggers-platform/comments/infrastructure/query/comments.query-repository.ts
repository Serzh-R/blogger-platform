import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Comment } from '../../domain/comment.entity';
import type { CommentModelType } from '../../domain/comment.entity';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';

@Injectable()
export class CommentsQueryRepository {
   constructor(
      @InjectModel(Comment.name)
      private readonly CommentModel: CommentModelType,
   ) {}

   async findById(id: string): Promise<CommentViewDto | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      const comment = await this.CommentModel.findById(id);

      if (!comment) {
         return null;
      }

      return CommentViewDto.mapToView(comment);
   }

   async findCommentsByPostId(
      postId: string,
      query: GetCommentsQueryParams,
   ): Promise<PaginatedViewDto<CommentViewDto>> {
      const filter = { postId };

      const totalCount = await this.CommentModel.countDocuments(filter);

      const comments = await this.CommentModel.find(filter)
         .sort({ [query.sortBy]: query.sortDirection })
         .skip(query.calculateSkip())
         .limit(query.pageSize);

      return PaginatedViewDto.mapToView({
         items: comments.map((comment) => CommentViewDto.mapToView(comment)),
         page: query.pageNumber,
         pageSize: query.pageSize,
         totalCount,
      });
   }
}
