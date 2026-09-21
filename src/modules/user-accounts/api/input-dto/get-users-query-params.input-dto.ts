import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { UsersSortBy } from './users-sort-by';

export class GetUsersQueryParams extends BaseQueryParams {
   @IsEnum(UsersSortBy)
   sortBy: UsersSortBy = UsersSortBy.CreatedAt;

   @IsString()
   @IsOptional()
   searchLoginTerm: string | null = null;

   @IsString()
   @IsOptional()
   searchEmailTerm: string | null = null;
}
