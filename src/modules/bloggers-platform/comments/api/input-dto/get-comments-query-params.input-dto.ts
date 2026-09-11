import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export enum CommentsSortBy {
   CreatedAt = 'createdAt',
}

export class GetCommentsQueryParams extends BaseQueryParams {
   sortBy: CommentsSortBy = CommentsSortBy.CreatedAt;
}
