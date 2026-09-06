import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Result, ResultStatus } from '../../../core/result/result.types';
import { CreateUserInputDto } from '../api/input-dto/create-user.input-dto';
import { User } from '../domain/user.entity';
import type { UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private readonly UserModel: UserModelType,
        private readonly usersRepository: UsersRepository,
        private readonly bcryptService: BcryptService,
    ) {}

    async createUser(
        dto: CreateUserInputDto,
    ): Promise<Result<string>> {
        const userByLogin = await this.usersRepository.findByLogin(dto.login);

        if (userByLogin) {
            return {
                status: ResultStatus.BadRequest,
                extensions: [
                    {
                        field: 'login',
                        message: 'login should be unique',
                    },
                ],
                data: null,
            };
        }

        const userByEmail = await this.usersRepository.findByEmail(dto.email);

        if (userByEmail) {
            return {
                status: ResultStatus.BadRequest,
                extensions: [
                    {
                        field: 'email',
                        message: 'email should be unique',
                    },
                ],
                data: null,
            };
        }

        const passwordHash = await this.bcryptService.generateHash(dto.password);

        const user = this.UserModel.createInstance({
            login: dto.login,
            email: dto.email,
            passwordHash,
        });

        await this.usersRepository.save(user);

        return {
            status: ResultStatus.Created,
            extensions: [],
            data: user._id.toString(),
        };
    }
}