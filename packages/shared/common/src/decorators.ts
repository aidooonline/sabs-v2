import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.companyId;
  },
);

export const ApiPagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { page = 1, limit = 20, sortBy, sortOrder = 'DESC' } = request.query;
    
    return {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 items per page
      sortBy,
      sortOrder: sortOrder.toUpperCase(),
    };
  },
);