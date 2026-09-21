import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { passwordConstraints } from '../../domain/user.entity';

export class NewPasswordInputDto {
   @IsString()
   @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
   @Trim()
   newPassword: string;

   @IsString()
   @Trim()
   recoveryCode: string;
}
