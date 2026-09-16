import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';
import type { UserContextDto } from '../guards/dto/user-context.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
   constructor(
      private readonly usersRepository: UsersRepository,
      private readonly bcryptService: BcryptService,
      private readonly jwtService: JwtService,
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

   async login(userId: string): Promise<{ accessToken: string }> {
      const payload: UserContextDto = {
         id: userId,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return {
         accessToken,
      };
   }
}
