import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetBlogsQueryParams extends BaseQueryParams {
   sortBy: string = 'createdAt';
   searchNameTerm: string | null = null;
}
