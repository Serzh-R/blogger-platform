import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';
import type { UserContextDto } from '../guards/dto/user-context.dto';

@Injectable()
export class AuthService {
   constructor(
      private readonly usersRepository: UsersRepository,
      private readonly bcryptService: BcryptService,
   ) {}

   async validateUser(
      loginOrEmail: string,
      password: string,
   ): Promise<UserContextDto | null> {
      const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);

      if (!user) {
         return null;
      }

      const isPasswordValid = await this.bcryptService.comparePasswords(
         password,
         user.passwordHash,
      );

      if (!isPasswordValid) {
         return null;
      }

      return {
         id: user._id.toString(),
      };
   }
}
