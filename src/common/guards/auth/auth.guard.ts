import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { Request } from 'express';
import { ROLES_KEY } from 'src/common/decorator/rolesDecorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    type AuthenticatedRequest = Request & { user?: User };

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Unauthorized');
    }

    const rawToken = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : authorization;

    const decoded: unknown = this.jwtService.decode(rawToken);
    if (!decoded || typeof decoded !== 'object' || decoded === null) {
      throw new UnauthorizedException('Unauthorized');
    }

    const decodedRecord = decoded as Record<string, unknown>;
    const userId =
      typeof decodedRecord.id === 'string' ? decodedRecord.id : null;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    let user: User | null;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientUnknownRequestError ||
        error instanceof Prisma.PrismaClientValidationError
      ) {
        throw new ServiceUnavailableException('Database unavailable');
      }
      throw error;
    }

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role)
    ) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
