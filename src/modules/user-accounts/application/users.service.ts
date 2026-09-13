import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserInputDto } from '../api/input-dto/create-user.input-dto';
import { User } from '../domain/user.entity';
import type { UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class UsersService {
   constructor(
      @InjectModel(User.name)
      private readonly UserModel: UserModelType,
      private readonly usersRepository: UsersRepository,
      private readonly bcryptService: BcryptService,
   ) {}

   async createUser(dto: CreateUserInputDto): Promise<string> {
      const userByLogin = await this.usersRepository.findByLogin(dto.login);

      if (userByLogin) {
         throw new DomainException({
            code: DomainExceptionCode.BadRequest,
            message: 'User with this login already exists',
            extensions: [
               {
                  field: 'login',
                  message: 'login should be unique',
               },
            ],
         });
      }

      const userByEmail = await this.usersRepository.findByEmail(dto.email);

      if (userByEmail) {
         throw new DomainException({
            code: DomainExceptionCode.BadRequest,
            message: 'User with this email already exists',
            extensions: [
               {
                  field: 'email',
                  message: 'email should be unique',
               },
            ],
         });
      }

      const passwordHash = await this.bcryptService.generateHash(dto.password);

      const user = this.UserModel.createInstance({
         login: dto.login,
         email: dto.email,
         passwordHash,
      });

      await this.usersRepository.save(user);

      return user._id.toString();
   }

   async deleteUser(id: string): Promise<void> {
      const user = await this.usersRepository.findById(id);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'User not found',
         });
      }

      user.makeDeleted();

      await this.usersRepository.save(user);
   }
}
