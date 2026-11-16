import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../domain/user.entity';
import type { UserModelType } from '../../domain/user.entity';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { PostgresService } from '../../../../core/postgres.service';
import { isUUID } from 'class-validator';

@Injectable()
export class UsersQueryRepository {
   constructor(
      @InjectModel(User.name)
      private readonly UserModel: UserModelType,
      private readonly postgresService: PostgresService,
   ) {}

   async findById(id: string): Promise<UserViewDto | null> {
      if (!isUUID(id)) {
         return null;
      }

      const findUserByIdSql =
         'SELECT id, login, email, created_at\n' +
         'FROM users\n' +
         'WHERE id = $1 AND deleted_at IS NULL';

      const userResponse = await this.postgresService.pool.query(
         findUserByIdSql,
         [id],
      );

      const foundUser = userResponse.rows[0];

      if (!foundUser) {
         return null;
      }

      return {
         id: foundUser.id,
         login: foundUser.login,
         email: foundUser.email,
         createdAt: foundUser.created_at.toISOString(),
      };
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

      const sqlQueryText =
         'SELECT COUNT(*) AS total_count FROM users WHERE ' + whereCondition;

      const databaseResponse = await this.postgresService.pool.query(
         sqlQueryText,
         sqlValues,
      );

      const foundUsersCount = Number(databaseResponse.rows[0].total_count);

      const pageSizePosition = sqlValues.push(query.pageSize);

      const pageSizePlaceholder = '$' + pageSizePosition;

      const offsetPosition = sqlValues.push(query.calculateSkip());

      const offsetPlaceholder = '$' + offsetPosition;

      const paginationSql =
         'LIMIT ' + pageSizePlaceholder + ' OFFSET ' + offsetPlaceholder;

      const sortColumn =
         query.sortBy === 'createdAt' ? 'created_at' : query.sortBy;

      const orderBySql = 'ORDER BY ' + sortColumn + ' ' + query.sortDirection;

      const usersPageQueryText =
         'SELECT id, login, email, created_at FROM users WHERE ' +
         whereCondition +
         ' ' +
         orderBySql +
         ' ' +
         paginationSql;

      const usersPageResponse = await this.postgresService.pool.query(
         usersPageQueryText,
         sqlValues,
      );

      //console.log('Пользователи из PostgreSQL:', usersPageResponse.rows);

      const usersPageItems = usersPageResponse.rows.map((user) => ({
         id: user.id,
         login: user.login,
         email: user.email,
         createdAt: user.created_at.toISOString(),
      }));

      //console.log('Пользователи для API:', usersPageItems);

      // ********************************************************************

      /*const filter: QueryFilter<User> = {
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

      const items = users.map((user) => UserViewDto.mapToView(user));*/

      return PaginatedViewDto.mapToView({
         items: usersPageItems,
         page: query.pageNumber,
         pageSize: query.pageSize,
         totalCount: foundUsersCount,
      });
   }
}
