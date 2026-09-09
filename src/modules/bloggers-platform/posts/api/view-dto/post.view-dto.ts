import { PostDocument } from '../../domain/post.entity';

export class NewestLikeViewDto {
   addedAt: string;
   userId: string;
   login: string;
}

export class ExtendedLikesInfoViewDto {
   likesCount: number;
   dislikesCount: number;
   myStatus: 'None';
   newestLikes: NewestLikeViewDto[];
}

export class PostViewDto {
   id: string;
   title: string;
   shortDescription: string;
   content: string;
   blogId: string;
   blogName: string;
   createdAt: string;
   extendedLikesInfo: ExtendedLikesInfoViewDto;

   static mapToView(
      post: PostDocument,
      newestLikes: NewestLikeViewDto[],
   ): PostViewDto {
      const dto = new PostViewDto();

      dto.id = post._id.toString();
      dto.title = post.title;
      dto.shortDescription = post.shortDescription;
      dto.content = post.content;
      dto.blogId = post.blogId;
      dto.blogName = post.blogName;
      dto.createdAt = post.createdAt.toISOString();

      dto.extendedLikesInfo = {
         likesCount: post.likesCount,
         dislikesCount: post.dislikesCount,
         myStatus: 'None',
         newestLikes,
      };

      return dto;
   }
}
