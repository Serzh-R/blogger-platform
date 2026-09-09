import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetPostsQueryParams extends BaseQueryParams {
   sortBy: string = 'createdAt';
}
