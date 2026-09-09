import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Types } from 'mongoose';
import { LikesQueryRepository } from '../../../likes/infrastructure/query/likes.query-repository';
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

   async findById(id: string): Promise<PostViewDto | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      const post = await this.PostModel.findById(id);

      if (!post) {
         return null;
      }

      const likes = await this.likesQueryRepository.findNewestByPostId(
         post._id.toString(),
      );

      const newestLikes = likes.map((like) => ({
         addedAt: like.createdAt.toISOString(),
         userId: like.authorId,
         login: like.authorLogin,
      }));

      return PostViewDto.mapToView(post, newestLikes);
   }

   async findAll(
      query: GetPostsQueryParams,
      blogId?: string,
   ): Promise<PaginatedViewDto<PostViewDto>> {
      const filter: QueryFilter<Post> = {};

      if (blogId !== undefined) {
         filter.blogId = blogId;
      }

      const totalCount = await this.PostModel.countDocuments({ filter });

      const posts = await this.PostModel.find({ filter })
         .sort({ [query.sortBy]: query.sortDirection })
         .skip(query.calculateSkip())
         .limit(query.pageSize);

      const items: PostViewDto[] = [];

      for (const post of posts) {
         const likes = await this.likesQueryRepository.findNewestByPostId(
            post._id.toString(),
         );

         const newestLikes = likes.map((like) => ({
            addedAt: like.createdAt.toISOString(),
            userId: like.authorId,
            login: like.authorLogin,
         }));

         items.push(PostViewDto.mapToView(post, newestLikes));
      }

      return PaginatedViewDto.mapToView({
         items,
         page: query.pageNumber,
         pageSize: query.pageSize,
         totalCount,
      });
   }
}
