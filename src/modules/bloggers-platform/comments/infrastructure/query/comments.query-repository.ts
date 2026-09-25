import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Comment } from '../../domain/comment.entity';
import type { CommentModelType } from '../../domain/comment.entity';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { LikesQueryRepository } from '../../../likes/infrastructure/query/likes.query-repository';
import { LikeStatus } from '../../../likes/domain/like-status.enum';

@Injectable()
export class CommentsQueryRepository {
   constructor(
      @InjectModel(Comment.name)
      private readonly CommentModel: CommentModelType,
      private readonly likesQueryRepository: LikesQueryRepository,
   ) {}

   async findById(
      id: string,
      userId: string | null = null,
   ): Promise<CommentViewDto | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      const comment = await this.CommentModel.findById(id);

      if (!comment) {
         return null;
      }

      const commentId = comment._id.toString();

      const myStatusesMap = await this.likesQueryRepository.findMyStatuses(
         [commentId],
         userId,
      );

      return CommentViewDto.mapToView(
         comment,
         myStatusesMap.get(commentId) ?? LikeStatus.None,
      );
   }

   async findCommentsByPostId(
      postId: string,
      query: GetCommentsQueryParams,
      userId: string | null = null,
   ): Promise<PaginatedViewDto<CommentViewDto>> {
      const filter = { postId };

      const totalCount = await this.CommentModel.countDocuments(filter);

      const comments = await this.CommentModel.find(filter)
         .sort({ [query.sortBy]: query.sortDirection })
         .skip(query.calculateSkip())
         .limit(query.pageSize);

      const commentIds = comments.map((comment) => comment._id.toString());

      const myStatusesMap = await this.likesQueryRepository.findMyStatuses(
         commentIds,
         userId,
      );

      return PaginatedViewDto.mapToView({
         items: comments.map((comment) => {
            const commentId = comment._id.toString();

            return CommentViewDto.mapToView(
               comment,
               myStatusesMap.get(commentId) ?? LikeStatus.None,
            );
         }),
         page: query.pageNumber,
         pageSize: query.pageSize,
         totalCount,
      });
   }
}
