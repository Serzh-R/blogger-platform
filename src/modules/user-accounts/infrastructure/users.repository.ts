import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../domain/user.entity';
import type { UserModelType, UserDocument } from '../domain/user.entity';
import { Types } from 'mongoose'

@Injectable()
export class UsersRepository {
    constructor(
        @InjectModel(User.name)
        private readonly UserModel: UserModelType,
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

    async findOrNotFoundFail(id: string): Promise<UserDocument> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
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
}