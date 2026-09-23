import { IsEnum } from 'class-validator';
import { LikeStatus } from '../../domain/like-status.enum';

export class UpdateLikeStatusInputDto {
   @IsEnum(LikeStatus)
   likeStatus: LikeStatus;
}
