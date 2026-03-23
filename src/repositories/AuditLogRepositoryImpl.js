import { getPrismaClient } from '../infrastructure/database/prismaClient.js';

export class AuditLogRepositoryImpl {
  async create({ actorUserId, action, entityType = 'USER', entityId, details, ip, userAgent }) {
    const prisma = await getPrismaClient();
    return prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId: entityId ?? undefined,
        details: details === undefined ? undefined : details,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined
      }
    });
  }

  async list({ page = 1, limit = 20, actorUserId, action, from, to } = {}) {
    const prisma = await getPrismaClient();
    const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const where = {
      ...(actorUserId && { actorUserId }),
      ...(action && { action }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) })
        }
      })
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, role: true } }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs: items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    };
  }

  async findRecentForAdmin(limit = 10) {
    const prisma = await getPrismaClient();
    const take = Math.min(Math.max(limit, 1), 50);
    return prisma.auditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, role: true } }
      }
    });
  }

  async findRecentForOwner(ownerId, managedUserIds, limit = 10) {
    const prisma = await getPrismaClient();
    const take = Math.min(Math.max(limit, 1), 50);
    const orFilters = [{ actorUserId: ownerId }];
    if (managedUserIds?.length) {
      orFilters.push({ entityType: 'USER', entityId: { in: managedUserIds } });
    }
    return prisma.auditLog.findMany({
      where: { OR: orFilters },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, role: true } }
      }
    });
  }
}
