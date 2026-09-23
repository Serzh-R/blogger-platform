import type { LikeStatus } from '../like-status.enum';

export class CreateLikeDomainDto {
   status: LikeStatus.Like | LikeStatus.Dislike;
   authorId: string;
   authorLogin: string;
   parentId: string;
}
