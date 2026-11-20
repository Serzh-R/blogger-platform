import { Injectable } from '@nestjs/common';
import { UsersQueryRepository } from './users.query-repository';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class AuthQueryRepository {
   constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

   async me(userId: string): Promise<MeViewDto> {
      const user = await this.usersQueryRepository.findById(userId);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'User not found',
         });
      }

      return MeViewDto.mapToView(user);
   }
}
