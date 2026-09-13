import { IsString, Length, Matches } from 'class-validator';
import {
   emailConstraints,
   loginConstraints,
   passwordConstraints,
} from '../../domain/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';

export class CreateUserInputDto {
   @IsString()
   @Length(loginConstraints.minLength, loginConstraints.maxLength)
   @Matches(loginConstraints.match)
   @Trim()
   login: string;

   @IsString()
   @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
   password: string;

   @IsString()
   @Matches(emailConstraints.match)
   @Trim()
   email: string;
}
