import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

export class BaseRepository<T extends BaseEntity> extends Repository<T> {
  async findByCompany(
    companyId: string,
    options?: FindManyOptions<T>,
  ): Promise<T[]> {
    return this.find({
      ...options,
      where: {
        ...(options?.where as any),
        companyId,
      } as any,
    });
  }

  async findOneByCompany(
    companyId: string,
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    return this.findOne({
      ...options,
      where: {
        ...(options?.where as any),
        companyId,
      } as any,
    });
  }

  async createForCompany(companyId: string, data: Partial<T>): Promise<T> {
    const entity = this.create({
      ...data,
      companyId,
    } as any);
    return this.save(entity as any);
  }
}