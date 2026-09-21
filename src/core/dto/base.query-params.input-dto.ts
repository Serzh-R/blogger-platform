import { Type } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';

export enum SortDirection {
   Asc = 'asc',
   Desc = 'desc',
}

export class BaseQueryParams {
   @Type(() => Number)
   @IsNumber()
   pageNumber: number = 1;

   @Type(() => Number)
   @IsNumber()
   pageSize: number = 10;

   @IsEnum(SortDirection)
   sortDirection: SortDirection = SortDirection.Desc;

   calculateSkip(): number {
      return (this.pageNumber - 1) * this.pageSize;
   }
}
