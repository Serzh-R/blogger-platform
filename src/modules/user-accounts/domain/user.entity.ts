import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain-dto';

@Schema({
    collection: 'users',
    timestamps: true,
    versionKey: false,
})
export class User {
    @Prop({ type: String, required: true })
    login: string;

    @Prop({ type: String, required: true })
    email: string;

    @Prop({ type: String, required: true })
    passwordHash: string;

    createdAt: Date;
    updatedAt: Date;

    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    static createInstance(dto: CreateUserDomainDto): UserDocument {
        const user = new this();

        user.login = dto.login;
        user.email = dto.email;
        user.passwordHash = dto.passwordHash;
        user.deletedAt = null;

        return user as UserDocument;
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