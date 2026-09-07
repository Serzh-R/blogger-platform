import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/paginated.view-dto';
import { UserViewDto } from './view-dto/user.view-dto';
import { CreateUserInputDto } from './input-dto/create-user.input-dto';
import { ResultStatus } from '../../../core/result/result.types';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  async getUsers(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto>> {
    return this.usersQueryRepository.findAll(query);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const result = await this.usersService.createUser(body);

    if (result.status === ResultStatus.BadRequest) {
      throw new BadRequestException({
        errorsMessage: result.extensions,
      });
    }

    if (!result.data) {
      throw new InternalServerErrorException(
        'User ID was not returned after creation',
      );
    }

    const createdUser = await this.usersQueryRepository.findById(result.data);

    if (!createdUser) {
      throw new InternalServerErrorException('Created user was not found');
    }

    return createdUser;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    const result = await this.usersService.deleteUser(id);

    if (result.status === ResultStatus.NotFound) {
      throw new NotFoundException('User not found');
    }
  }
}
