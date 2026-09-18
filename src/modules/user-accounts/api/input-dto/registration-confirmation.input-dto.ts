import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

export class RegistrationConfirmationInputDto {
   @IsString()
   @IsNotEmpty()
   @Trim()
   code: string;
}
