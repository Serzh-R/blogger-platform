import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class AuthQueryRepository {
   constructor(private readonly usersRepository: UsersRepository) {}

   async me(userId: string): Promise<MeViewDto> {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'User not found',
         });
      }

      return MeViewDto.mapToView(user);
   }
}
