import { DtsRepository, DtFilterParams, DtWithMetersDto } from './dts.repository.js';
import { PaginatedResult, PaginationParams, SingleResult, DtDto } from '../../common/types.js';
import { NotFoundError } from '../../common/errors.js';

export class DtsService {
  constructor(private repo = new DtsRepository()) {}

  public listDts(
    filters: DtFilterParams,
    pagination: PaginationParams
  ): PaginatedResult<DtDto> {
    const page = Math.max(1, pagination.page);
    const pageSize = Math.min(100, Math.max(1, pagination.pageSize));

    const { items, total } = this.repo.findMany(filters, { page, pageSize });
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      success: true,
      data: items,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public getDtByCode(code: string): SingleResult<DtWithMetersDto> {
    const dt = this.repo.findByCode(code);
    if (!dt) {
      throw new NotFoundError('Distribution transformer', code);
    }

    return {
      success: true,
      data: dt,
    };
  }
}
