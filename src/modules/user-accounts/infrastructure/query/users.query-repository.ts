import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import { User } from '../../domain/user.entity';
import type { UserModelType } from '../../domain/user.entity';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { PostgresService } from '../../../../core/postgres.service';

@Injectable()
export class UsersQueryRepository {
   constructor(
      @InjectModel(User.name)
      private readonly UserModel: UserModelType,
      private readonly postgresService: PostgresService,
   ) {}

   async findById(id: string): Promise<UserViewDto | null> {
      if (!Types.ObjectId.isValid(id)) {
         return null;
      }

      const user = await this.UserModel.findOne({
         _id: id,
         deletedAt: null,
      });

      if (!user) {
         return null;
      }

      return UserViewDto.mapToView(user);
   }

   async findAll(
      query: GetUsersQueryParams,
   ): Promise<PaginatedViewDto<UserViewDto>> {
      const sqlValues: (string | number)[] = [];
      const sqlSearchConditions: string[] = [];

      if (query.searchLoginTerm) {
         sqlValues.push(`%${query.searchLoginTerm}%`);

         sqlSearchConditions.push('login ILIKE $' + sqlValues.length);
      }

      if (query.searchEmailTerm) {
         sqlValues.push(`%${query.searchEmailTerm}%`);

         sqlSearchConditions.push('email ILIKE $' + sqlValues.length);
      }

      let whereCondition = 'deleted_at IS NULL';

      if (sqlSearchConditions.length > 0) {
         whereCondition =
            whereCondition + ' AND (' + sqlSearchConditions.join(' OR ') + ')';
      }

      const countSql =
         'SELECT COUNT(*) AS total_count FROM users WHERE ' + whereCondition;

      const countResult = await this.postgresService.pool.query(
         countSql,
         sqlValues,
      );

      const sqlTotalCount = Number(countResult.rows[0].total_count)

      console.log(sqlTotalCount);

      const filter: QueryFilter<User> = {
         deletedAt: null,
      };

      const searchConditions: QueryFilter<User>[] = [];

      if (query.searchLoginTerm) {
         searchConditions.push({
            login: {
               $regex: query.searchLoginTerm,
               $options: 'i',
            },
         });
      }

      if (query.searchEmailTerm) {
         searchConditions.push({
            email: {
               $regex: query.searchEmailTerm,
               $options: 'i',
            },
         });
      }

      if (searchConditions.length > 0) {
         filter.$or = searchConditions;
      }

      const totalCount = await this.UserModel.countDocuments(filter);

      const users = await this.UserModel.find(filter)
         .sort({
            [query.sortBy]: query.sortDirection,
         })
         .skip(query.calculateSkip())
         .limit(query.pageSize);

      const items = users.map((user) => UserViewDto.mapToView(user));

      return PaginatedViewDto.mapToView({
         items,
         page: query.pageNumber,
         pageSize: query.pageSize,
         totalCount,
      });
   }
}
