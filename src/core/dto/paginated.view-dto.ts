export class PaginatedViewDto<T> {
    pagesCount: number;
    page: number;
    pageSize: number;
    totalCount: number;
    items: T[];

    static mapToView<T>(data: {
        items: T[];
        page: number;
        pageSize: number;
        totalCount: number;
    }): PaginatedViewDto<T> {
        return {
            pagesCount: Math.ceil(data.totalCount / data.pageSize),
            page: data.page,
            pageSize: data.pageSize,
            totalCount: data.totalCount,
            items: data.items,
        };
    }
}