import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const Org = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user?.organizationId) {
      throw new UnauthorizedException(
        'Organization not found in token',
      );
    }

    return request.user.organizationId;
  },
);