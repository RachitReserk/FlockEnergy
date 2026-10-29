import { MetersRepository, MeterFilterParams, MeterSortParams, MeterStatsDto } from './meters.repository.js';
import { PaginatedResult, PaginationParams, SingleResult, MeterDto } from '../../common/types.js';
import { NotFoundError } from '../../common/errors.js';

export class MetersService {
  constructor(private repo = new MetersRepository()) {}

  public listMeters(
    filters: MeterFilterParams,
    pagination: PaginationParams,
    sort: MeterSortParams
  ): PaginatedResult<MeterDto> {
    const page = Math.max(1, pagination.page);
    const pageSize = Math.min(100, Math.max(1, pagination.pageSize));

    const { items, total } = this.repo.findMany(filters, { page, pageSize }, sort);
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

  public getMeterById(meterId: string): SingleResult<MeterDto> {
    const meter = this.repo.findById(meterId);
    if (!meter) {
      throw new NotFoundError('Meter', meterId);
    }

    return {
      success: true,
      data: meter,
    };
  }

  public getStats(): SingleResult<MeterStatsDto> {
    const stats = this.repo.getStats();
    return {
      success: true,
      data: stats,
    };
  }
}
