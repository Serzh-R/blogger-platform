import { IsString, Matches } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { emailConstraints } from '../../domain/user.entity';

export class RegistrationEmailResendingInputDto {
   @IsString()
   @Matches(emailConstraints.match)
   @Trim()
   email: string;
}
