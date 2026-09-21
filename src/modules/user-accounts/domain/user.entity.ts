import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain-dto';
import {
   EmailConfirmation,
   EmailConfirmationSchema,
} from './email-confirmation.schema';
import {
   PasswordRecovery,
   PasswordRecoverySchema,
} from './password-recovery.schema';

export const loginConstraints = {
   minLength: 3,
   maxLength: 10,
   match: /^[a-zA-Z0-9_-]*$/,
};

export const passwordConstraints = {
   minLength: 6,
   maxLength: 20,
};

export const emailConstraints = {
   match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
};

@Schema({
   collection: 'users',
   timestamps: true,
   versionKey: false,
})
export class User {
   @Prop({ type: String, required: true, ...loginConstraints })
   login: string;

   @Prop({ type: String, required: true, ...emailConstraints })
   email: string;

   @Prop({ type: String, required: true })
   passwordHash: string;

   @Prop({
      type: EmailConfirmationSchema,
      required: true,
      default: () => ({
         confirmationCode: null,
         expirationDate: null,
         isConfirmed: false,
      }),
   })
   emailConfirmation: EmailConfirmation;

   @Prop({
      type: PasswordRecoverySchema,
      required: true,
      default: () => ({
         recoveryCode: null,
         expirationDate: null,
      }),
   })
   passwordRecovery: PasswordRecovery;

   createdAt: Date;
   updatedAt: Date;

   @Prop({ type: Date, default: null })
   deletedAt: Date | null;

   static createInstance(dto: CreateUserDomainDto): UserDocument {
      const user = new this();

      user.login = dto.login;
      user.email = dto.email;
      user.passwordHash = dto.passwordHash;
      user.emailConfirmation = {
         confirmationCode: null,
         expirationDate: null,
         isConfirmed: false,
      };
      user.passwordRecovery = {
         recoveryCode: null,
         expirationDate: null,
      };
      user.deletedAt = null;

      return user as UserDocument;
   }

   setConfirmationCode(code: string, expirationDate: Date): boolean {
      if (this.emailConfirmation.isConfirmed) {
         return false;
      }

      this.emailConfirmation.confirmationCode = code;
      this.emailConfirmation.expirationDate = expirationDate;

      return true;
   }

   confirmEmail(
      confirmationCode: string,
      currentDate: Date = new Date(),
   ): boolean {
      if (this.emailConfirmation.isConfirmed) {
         return false;
      }

      if (this.emailConfirmation.confirmationCode !== confirmationCode) {
         return false;
      }

      const expirationDate = this.emailConfirmation.expirationDate;

      if (
         !expirationDate ||
         expirationDate.getTime() <= currentDate.getTime()
      ) {
         return false;
      }

      this.emailConfirmation.isConfirmed = true;

      return true;
   }

   setPasswordRecoveryCode(recoveryCode: string, expirationDate: Date): void {
      this.passwordRecovery.recoveryCode = recoveryCode;
      this.passwordRecovery.expirationDate = expirationDate;
   }

   isPasswordRecoveryCodeValid(
      recoveryCode: string,
      currentDate: Date = new Date(),
   ): boolean {
      if (this.passwordRecovery.recoveryCode !== recoveryCode) {
         return false;
      }

      const expirationDate = this.passwordRecovery.expirationDate;

      if (
         !expirationDate ||
         expirationDate.getTime() <= currentDate.getTime()
      ) {
         return false;
      }

      return true;
   }

   setNewPasswordHash(passwordHash: string): void {
      this.passwordHash = passwordHash;

      this.passwordRecovery.recoveryCode = null;
      this.passwordRecovery.expirationDate = null;
   }

   makeDeleted(): void {
      if (this.deletedAt !== null) {
         throw new Error('User is already deleted');
      }

      this.deletedAt = new Date();
   }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<User> & typeof User;
