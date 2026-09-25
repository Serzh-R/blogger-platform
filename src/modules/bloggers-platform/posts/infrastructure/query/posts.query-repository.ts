import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Types } from 'mongoose';
import { LikesQueryRepository } from '../../../likes/infrastructure/query/likes.query-repository';
import { LikeStatus } from '../../../likes/domain/like-status.enum';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { Post } from '../../domain/post.entity';
import type { PostModelType } from '../../domain/post.entity';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';

@Injectable()
export class PostsQueryRepository {
   constructor(
      @InjectModel(Post.name)
      private readonly PostModel: PostModelType,
      private readonly likesQueryRepository: LikesQueryRepository,
   ) {}

   async findById(
      id: string,
      userId: string | null = null,
   ): Promise<PostViewDto | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      const post = await this.PostModel.findById(id);

      if (!post) {
         return null;
      }

      const postId = post._id.toString();

      const myStatusesMap = await this.likesQueryRepository.findMyStatuses(
         [postId],
         userId,
      );

      const likes =
         await this.likesQueryRepository.findThreeNewestLikesByPostId(postId);

      const newestLikes = likes.map((like) => ({
         addedAt: like.createdAt.toISOString(),
         userId: like.authorId,
         login: like.authorLogin,
      }));

      return PostViewDto.mapToView(
         post,
         newestLikes,
         myStatusesMap.get(postId) ?? LikeStatus.None,
      );
   }

   async findAll(
      query: GetPostsQueryParams,
      blogId?: string,
      userId: string | null = null,
   ): Promise<PaginatedViewDto<PostViewDto>> {
      const filter: QueryFilter<Post> = {};

      if (blogId !== undefined) {
         filter.blogId = blogId;
      }

      const [totalCount, posts] = await Promise.all([
         this.PostModel.countDocuments(filter),

         this.PostModel.find(filter)
            .sort({ [query.sortBy]: query.sortDirection })
            .skip(query.calculateSkip())
            .limit(query.pageSize),
      ]);

      const postIds = posts.map((post) => post._id.toString());

      const myStatusesMap = await this.likesQueryRepository.findMyStatuses(
         postIds,
         userId,
      );

      const items = await Promise.all(
         posts.map(async (post): Promise<PostViewDto> => {
            const postId = post._id.toString();

            const likes =
               await this.likesQueryRepository.findThreeNewestLikesByPostId(
                  postId,
               );

            const newestLikes = likes.map((like) => ({
               addedAt: like.createdAt.toISOString(),
               userId: like.authorId,
               login: like.authorLogin,
            }));

            return PostViewDto.mapToView(
               post,
               newestLikes,
               myStatusesMap.get(postId) ?? LikeStatus.None,
            );
         }),
      );

      return PaginatedViewDto.mapToView({
         items,
         page: query.pageNumber,
         pageSize: query.pageSize,
         totalCount,
      });
   }
}
