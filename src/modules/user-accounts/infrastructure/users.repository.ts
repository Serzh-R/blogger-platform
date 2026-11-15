import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../domain/user.entity';
import type { UserModelType, UserDocument } from '../domain/user.entity';
import { Types } from 'mongoose';
import { PostgresService } from '../../../core/postgres.service';

@Injectable()
export class UsersRepository {
   constructor(
      @InjectModel(User.name)
      private readonly UserModel: UserModelType,
      private readonly postgresService: PostgresService,
   ) {}

   async findById(id: string): Promise<UserDocument | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      return this.UserModel.findOne({
         _id: id,
         deletedAt: null,
      });
   }

   async create(user: User) {
      const insertUserSql = `
      INSERT INTO users (login, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id
   `;

      const userValues = [user.login, user.email, user.passwordHash];

      const insertResponse = await this.postgresService.pool.query(
         insertUserSql,
         userValues,
      );

      return insertResponse.rows[0].id;
   }

   async save(user: UserDocument): Promise<void> {
      await user.save();
   }

   async findByLogin(login: string): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         login,
         deletedAt: null,
      });
   }

   async findByEmail(email: string): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         email,
         deletedAt: null,
      });
   }

   async findByConfirmationCode(
      confirmationCode: string,
   ): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         'emailConfirmation.confirmationCode': confirmationCode,
         deletedAt: null,
      });
   }

   async findByLoginOrEmail(
      loginOrEmail: string,
   ): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         deletedAt: null,
         $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
      });
   }

   async findByPasswordRecoveryCode(
      recoveryCode: string,
   ): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         'passwordRecovery.recoveryCode': recoveryCode,
         deletedAt: null,
      });
   }
}
