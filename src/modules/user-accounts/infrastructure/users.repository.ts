import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../domain/user.entity';
import type { UserModelType, UserDocument } from '../domain/user.entity';
import { Types } from 'mongoose';
import { PostgresService } from '../../../core/postgres.service';
import { isUUID } from 'class-validator';

@Injectable()
export class UsersRepository {
   constructor(
      @InjectModel(User.name)
      private readonly UserModel: UserModelType,
      private readonly postgresService: PostgresService,
   ) {}

   //*** SQL **********************************************************************

   async create(user: User) {
      const insertUserSql = `
      INSERT INTO users (login, email, password_hash, email_confirmation_code, email_confirmation_expiration_date, email_confirmation_is_confirmed)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
   `;

      const userValues = [
         user.login,
         user.email,
         user.passwordHash,
         user.emailConfirmation.confirmationCode,
         user.emailConfirmation.expirationDate,
         user.emailConfirmation.isConfirmed,
      ];

      const insertResponse = await this.postgresService.pool.query(
         insertUserSql,
         userValues,
      );

      return insertResponse.rows[0].id;
   }

   async makeDeleted(id: string): Promise<boolean> {
      if (!isUUID(id)) {
         return false;
      }

      const makeDeletedSql =
         'UPDATE users\n' +
         '\tSET updated_at=now(), deleted_at=now()\n' +
         '\tWHERE id = $1 AND deleted_at IS NULL';

      const updateResponse = await this.postgresService.pool.query(
         makeDeletedSql,
         [id],
      );

      return updateResponse.rowCount === 1;
   }

   async isLoginTaken(login: string): Promise<boolean> {
      const findUserByLoginSql =
         'SELECT login\n' + '    FROM users\n' + '    WHERE login = $1';

      const loginSearchResult = await this.postgresService.pool.query(
         findUserByLoginSql,
         [login],
      );

      return loginSearchResult.rows.length > 0;
   }

   async isEmailTaken(email: string): Promise<boolean> {
      const findUserByEmailSql =
         'SELECT email\n' + '    FROM users\n' + '    WHERE email = $1';

      const emailSearchResult = await this.postgresService.pool.query(
         findUserByEmailSql,
         [email],
      );

      return emailSearchResult.rows.length > 0;
   }

   async findByConfirmationCode(
      confirmationCode: string,
   ): Promise<User | null> {
      const findUserByConfirmationCodeSql =
         'SELECT id, email_confirmation_code, email_confirmation_expiration_date, email_confirmation_is_confirmed\n' +
         '\tFROM users\n' +
         '\tWHERE email_confirmation_code = $1 AND deleted_at IS NULL';

      const userResponse = await this.postgresService.pool.query(
         findUserByConfirmationCodeSql,
         [confirmationCode],
      );

      const foundUser = userResponse.rows[0];

      if (!foundUser) {
         return null;
      }

      const user = new User();

      user.id = foundUser.id;

      user.emailConfirmation = {
         confirmationCode: foundUser.email_confirmation_code,
         expirationDate: foundUser.email_confirmation_expiration_date,
         isConfirmed: foundUser.email_confirmation_is_confirmed,
      };

      return user;
   }

   async saveEmailConfirmation(user: User): Promise<void> {
      const confirmEmailSql =
         'UPDATE users\n' +
         '\tSET updated_at = now(), email_confirmation_is_confirmed = true\n' +
         '\tWHERE id = $1 and deleted_at IS NULL';

      await this.postgresService.pool.query(confirmEmailSql, [user.id]);
   }

   async findByLoginOrEmail(
      loginOrEmail: string,
   ): Promise<{ id: string; passwordHash: string } | null> {
      const findUserByLoginOrEmailSql =
         'SELECT id, password_hash\n' +
         '\tFROM users\n' +
         '\tWHERE deleted_at IS NULL AND (login = $1 OR email = $1)';

      const resultResponse = await this.postgresService.pool.query(
         findUserByLoginOrEmailSql,
         [loginOrEmail],
      );

      const foundUser = resultResponse.rows[0];

      if (!foundUser) {
         return null;
      }

      return {
         id: foundUser.id,
         passwordHash: foundUser.password_hash,
      };

      /*return this.UserModel.findOne({
         deletedAt: null,
         $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
      });*/
   }

   async findByEmailForConfirmation(email: string): Promise<User | null> {
      const findUserByEmailSql =
         'SELECT id, email, email_confirmation_is_confirmed\n' +
         '\tFROM users\n' +
         '\tWHERE deleted_at IS NULL AND email = $1';

      const resultResponse = await this.postgresService.pool.query(
         findUserByEmailSql,
         [email],
      );

      const foundUser = resultResponse.rows[0];

      if (!foundUser) {
         return null;
      }

      const user = new User();

      user.id = foundUser.id;
      user.email = foundUser.email;

      user.emailConfirmation = {
         confirmationCode: null,
         expirationDate: null,
         isConfirmed: foundUser.email_confirmation_is_confirmed,
      };

      user.passwordRecovery = {
         recoveryCode: null,
         expirationDate: null,
      };

      return user;
   }

   async updateEmailConfirmation(user: User): Promise<boolean> {
      const confirmEmailSql =
         'UPDATE users\n' +
         '\tSET updated_at = now(), email_confirmation_code=$2, email_confirmation_expiration_date=$3\n' +
         '\tWHERE id = $1 AND (deleted_at IS NULL AND email_confirmation_is_confirmed=false)';

      const updateResponse = await this.postgresService.pool.query(
         confirmEmailSql,
         [
            user.id,
            user.emailConfirmation.confirmationCode,
            user.emailConfirmation.expirationDate,
         ],
      );

      return updateResponse.rowCount === 1;
   }

   async updatePasswordRecoveryCode(user: User): Promise<boolean> {
      const confirmUpdatePasswordSql =
         'UPDATE users\n' +
         '\tSET updated_at=now(), password_recovery_code=$2, password_recovery_expiration_date=$3\n' +
         '\tWHERE id = $1 AND deleted_at IS NULL';

      const updateResponse = await this.postgresService.pool.query(
         confirmUpdatePasswordSql,
         [
            user.id,
            user.passwordRecovery.recoveryCode,
            user.passwordRecovery.expirationDate,
         ],
      );

      return updateResponse.rowCount === 1;
   }

   async findByPasswordRecoveryCode(
      recoveryCode: string,
   ): Promise<User | null> {
      const findByPasswordRecoverySql =
         'SELECT id, password_recovery_code, password_recovery_expiration_date\n' +
         '\tFROM users\n' +
         '\tWHERE password_recovery_code = $1 AND deleted_at IS NULL';

      const resultResponse = await this.postgresService.pool.query(
         findByPasswordRecoverySql,
         [recoveryCode],
      );

      const foundUser = resultResponse.rows[0];

      if (!foundUser) {
         return null;
      }

      const user = new User();

      user.id = foundUser.id;

      user.passwordRecovery = {
         recoveryCode: foundUser.password_recovery_code,
         expirationDate: foundUser.password_recovery_expiration_date,
      };

      return user;
   }

   async updatePasswordHash(
      user: User,
      recoveryCode: string,
   ): Promise<boolean> {
      const confirmUpdatePasswordHashSql =
         'UPDATE users\n' +
         '\tSET updated_at=now(), password_hash=$2, password_recovery_code=null, password_recovery_expiration_date=null' +
         '\tWHERE id = $1 AND password_recovery_code = $3 AND deleted_at IS NULL AND password_recovery_expiration_date > now()';

      const updateResponse = await this.postgresService.pool.query(
         confirmUpdatePasswordHashSql,
         [user.id, user.passwordHash, recoveryCode],
      );

      return updateResponse.rowCount === 1;
   }

   //****************************************************************************

   /*async findByEmail(email: string): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         email,
         deletedAt: null,
      });
   }*/

   async findById(id: string): Promise<UserDocument | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      return this.UserModel.findOne({
         _id: id,
         deletedAt: null,
      });
   }

   async save(user: UserDocument): Promise<void> {
      await user.save();
   }

   /*async findByLogin(login: string): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         login,
         deletedAt: null,
      });
   }*/

   /*async findByPasswordRecoveryCode(
      recoveryCode: string,
   ): Promise<UserDocument | null> {
      return this.UserModel.findOne({
         'passwordRecovery.recoveryCode': recoveryCode,
         deletedAt: null,
      });
   }*/
}
