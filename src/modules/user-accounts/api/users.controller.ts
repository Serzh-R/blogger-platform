import {
   Body,
   Controller,
   Delete,
   Get,
   HttpCode,
   HttpStatus,
   Param,
   Post,
   Query,
   UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/paginated.view-dto';
import { UserViewDto } from './view-dto/user.view-dto';
import { CreateUserInputDto } from './input-dto/create-user.input-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Controller('users')
@UseGuards(BasicAuthGuard)
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
      const userId = await this.usersService.createUser(body);

      const createdUser = await this.usersQueryRepository.findById(userId);

      if (!createdUser) {
         throw new DomainException({
            code: DomainExceptionCode.InternalServerError,
            message: 'Created user was not found',
         });
      }

      return createdUser;
   }

   @Delete(':id')
   @HttpCode(HttpStatus.NO_CONTENT)
   async deleteUser(@Param('id') id: string): Promise<void> {
      await this.usersService.deleteUser(id);
   }
}
