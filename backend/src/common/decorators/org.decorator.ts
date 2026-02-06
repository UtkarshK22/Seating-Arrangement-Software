import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Org = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user || !request.user.organizationId) {
      throw new Error('OrganizationId missing from JWT payload');
    }

    return request.user.organizationId;
  },
);
