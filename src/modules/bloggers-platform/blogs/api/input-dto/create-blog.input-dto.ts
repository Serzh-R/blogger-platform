import { IsString, Length, Matches } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class CreateBlogInputDto {
   @IsString()
   @Length(1, 15)
   @Trim()
   name: string;

   @IsString()
   @Length(1, 500)
   @Trim()
   description: string;

   @IsString()
   @Length(1, 100)
   @Matches(
      /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
   )
   @Trim()
   websiteUrl: string;
}
