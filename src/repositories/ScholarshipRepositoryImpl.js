import { getPrismaClient } from '../infrastructure/database/prismaClient.js';

export class ScholarshipRepositoryImpl {
  async create(data) {
    const prisma = await getPrismaClient();
    return prisma.scholarship.create({
      data,
      include: {
        createdBy: { select: { id: true, email: true, role: true, createdById: true } },
        verifiedBy: { select: { id: true, email: true, role: true } },
        documents: true
      }
    });
  }

  async update(id, data) {
    const prisma = await getPrismaClient();
    return prisma.scholarship.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, email: true, role: true, createdById: true } },
        verifiedBy: { select: { id: true, email: true, role: true } },
        documents: true
      }
    });
  }

  async softDelete(id) {
    const prisma = await getPrismaClient();
    return prisma.scholarship.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.scholarship.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, role: true, createdById: true } },
        verifiedBy: { select: { id: true, email: true, role: true } },
        documents: true
      }
    });
  }

  async list({ page = 1, limit = 20, search = '', status, country, createdById, scopeWhere } = {}) {
    const prisma = await getPrismaClient();
    const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const baseWhere = {
      ...(status && { status }),
      ...(country && { country }),
      ...(createdById && { createdById }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { provider: { contains: search, mode: 'insensitive' } },
          { fieldOfStudy: { contains: search, mode: 'insensitive' } }
        ]
      })
    };
    const where = scopeWhere ? { AND: [baseWhere, scopeWhere] } : baseWhere;

    const [items, total] = await Promise.all([
      prisma.scholarship.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, role: true, createdById: true } }
        }
      }),
      prisma.scholarship.count({ where })
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    };
  }

  async addDocument({ scholarshipId, fileName, fileUrl, mimeType, uploadedById }) {
    const prisma = await getPrismaClient();
    return prisma.scholarshipDocument.create({
      data: {
        scholarshipId,
        fileName,
        fileUrl,
        mimeType,
        uploadedById
      }
    });
  }

  async hasApplications(scholarshipId) {
    const prisma = await getPrismaClient();
    const total = await prisma.application.count({ where: { scholarshipId } });
    return total > 0;
  }

  async listPending({ page = 1, limit = 20 } = {}) {
    return this.list({ page, limit, status: 'PENDING' });
  }

  async updateVerificationStatus({ scholarshipId, status, verifiedById }) {
    return this.update(scholarshipId, {
      status,
      verifiedById
    });
  }

  async findExpirableScholarships(now = new Date()) {
    const prisma = await getPrismaClient();
    return prisma.scholarship.findMany({
      where: {
        isActive: true,
        deadline: { lt: now },
        status: {
          in: ['DRAFT', 'PENDING', 'VERIFIED']
        }
      },
      include: {
        createdBy: { select: { id: true, email: true, role: true } }
      }
    });
  }

  async markExpiredByIds(ids) {
    if (!ids?.length) {
      return { count: 0 };
    }
    const prisma = await getPrismaClient();
    return prisma.scholarship.updateMany({
      where: { id: { in: ids } },
      data: { status: 'EXPIRED' }
    });
  }
}
