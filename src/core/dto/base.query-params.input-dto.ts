import { Type } from 'class-transformer';

export enum SortDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export class BaseQueryParams {
    @Type(() => Number)
    pageNumber: number = 1;

    @Type(() => Number)
    pageSize: number = 10;

    sortDirection: SortDirection = SortDirection.Desc;

    calculateSkip(): number {
        return (this.pageNumber - 1) * this.pageSize;
    }
}