import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class UpdateCommentInputDto {
   @IsString()
   @Length(20, 300)
   @Trim()
   content: string;
}
