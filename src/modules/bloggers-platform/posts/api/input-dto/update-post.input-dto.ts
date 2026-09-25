import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class UpdatePostInputDto {
   @IsString()
   @Length(1, 30)
   @Trim()
   title: string;

   @IsString()
   @Length(1, 100)
   @Trim()
   shortDescription: string;

   @IsString()
   @Length(1, 1000)
   @Trim()
   content: string;

   @IsString()
   @Length(1)
   @Trim()
   blogId: string;
}
