import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserInputDto } from '../api/input-dto/create-user.input-dto';
import { User, UserDocument } from '../domain/user.entity';
import type { UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { EmailService } from '../../notifications/email.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UsersService {
   constructor(
      @InjectModel(User.name)
      private readonly UserModel: UserModelType,
      private readonly usersRepository: UsersRepository,
      private readonly bcryptService: BcryptService,
      private readonly emailService: EmailService,
   ) {}

   private async createUserDocument(
      dto: CreateUserInputDto,
   ): Promise<UserDocument> {
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

      return this.UserModel.createInstance({
         login: dto.login,
         email: dto.email,
         passwordHash,
      });
   }

   async createUser(dto: CreateUserInputDto): Promise<string> {
      const user = await this.createUserDocument(dto);

      await this.usersRepository.save(user);

      return user._id.toString();
   }

   async registerUser(dto: CreateUserInputDto): Promise<void> {
      const user = await this.createUserDocument(dto);

      const confirmationCode = randomUUID();

      const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      user.setConfirmationCode(confirmationCode, expirationDate);

      await this.usersRepository.save(user);

      try {
         await this.emailService.sendConfirmationEmail(
            user.email,
            confirmationCode,
         );
      } catch (error) {
         console.error('Confirmation email sending failed', error);
      }
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
