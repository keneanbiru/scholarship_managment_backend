import { getPrismaClient } from '../infrastructure/database/prismaClient.js';

export class GovernanceMetricsRepositoryImpl {
  async getAdminStatistics() {
    const prisma = await getPrismaClient();
    const [
      usersTotal,
      usersByRole,
      activeUsers,
      inactiveUsers,
      scholarshipGrouped,
      studentProfiles,
      applications,
      bookmarks
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.scholarship.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.studentProfile.count(),
      prisma.application.count(),
      prisma.bookmark.count()
    ]);

    const byRole = {};
    for (const g of usersByRole) {
      byRole[g.role] = g._count.id;
    }

    const byStatus = {};
    let scholarshipsTotal = 0;
    for (const g of scholarshipGrouped) {
      byStatus[g.status] = g._count.id;
      scholarshipsTotal += g._count.id;
    }

    return {
      users: {
        total: usersTotal,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole
      },
      scholarships: {
        total: scholarshipsTotal,
        byStatus
      },
      studentProfiles,
      applications,
      bookmarks
    };
  }

  async getOwnerStatistics(ownerId) {
    const prisma = await getPrismaClient();
    const where = { createdById: ownerId };
    const [total, active, inactive, byRoleRows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, isActive: true } }),
      prisma.user.count({ where: { ...where, isActive: false } }),
      prisma.user.groupBy({ by: ['role'], where, _count: { id: true } })
    ]);

    const byRole = {};
    for (const g of byRoleRows) {
      byRole[g.role] = g._count.id;
    }

    return {
      users: {
        total,
        active,
        inactive,
        byRole
      }
    };
  }

  async getManagedUserIds(ownerId) {
    const prisma = await getPrismaClient();
    const rows = await prisma.user.findMany({
      where: { createdById: ownerId },
      select: { id: true }
    });
    return rows.map((r) => r.id);
  }
}
