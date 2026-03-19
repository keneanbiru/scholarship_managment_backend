import { User } from '../domain/entities/User.js';
import { UserRepository } from '../domain/repositories/UserRepository.js';
import { getPrismaClient } from '../infrastructure/database/prismaClient.js';

// UserRepository Implementation using Prisma
export class UserRepositoryImpl extends UserRepository {
  async findById(id) {
    const prisma = await getPrismaClient();
    const userData = await prisma.user.findUnique({
      where: { id }
    });

    if (!userData) {
      return null;
    }

    return new User({
      id: userData.id,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
      isActive: userData.isActive,
      createdById: userData.createdById,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    });
  }

  async findByEmail(email) {
    const prisma = await getPrismaClient();
    const userData = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!userData) {
      return null;
    }

    return new User({
      id: userData.id,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
      isActive: userData.isActive,
      createdById: userData.createdById,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    });
  }

  async create(userData) {
    const prisma = await getPrismaClient();
    const created = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        passwordHash: userData.passwordHash,
        role: userData.role,
        isActive: userData.isActive ?? true,
        ...(userData.createdById && { createdById: userData.createdById })
      }
    });

    return new User({
      id: created.id,
      email: created.email,
      passwordHash: created.passwordHash,
      role: created.role,
      isActive: created.isActive,
      createdById: created.createdById,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    });
  }

  async update(id, updates) {
    const prisma = await getPrismaClient();
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(updates.email && { email: updates.email.toLowerCase() }),
        ...(updates.passwordHash && { passwordHash: updates.passwordHash }),
        ...(updates.role && { role: updates.role }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.createdById !== undefined && { createdById: updates.createdById })
      }
    });

    return new User({
      id: updated.id,
      email: updated.email,
      passwordHash: updated.passwordHash,
      role: updated.role,
      isActive: updated.isActive,
      createdById: updated.createdById,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    });
  }

  async delete(id) {
    const prisma = await getPrismaClient();
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
    return true;
  }

  async emailExists(email) {
    const prisma = await getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });
    return !!user;
  }

  async listUsers({ page = 1, limit = 20, search = '', role = null, createdById = null } = {}) {
    const prisma = await getPrismaClient();
    const skip = (Math.max(page, 1) - 1) * Math.max(limit, 1);
    const take = Math.max(limit, 1);
    const where = {
      ...(search && {
        email: { contains: search, mode: 'insensitive' }
      }),
      ...(role && { role }),
      ...(createdById && { createdById })
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: items.map((item) => new User({
        id: item.id,
        email: item.email,
        passwordHash: item.passwordHash,
        role: item.role,
        isActive: item.isActive,
        createdById: item.createdById,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      pagination: {
        page: Math.max(page, 1),
        limit: Math.max(limit, 1),
        total,
        totalPages: Math.max(Math.ceil(total / Math.max(limit, 1)), 1)
      }
    };
  }

  async findProfileByUserId(userId) {
    const prisma = await getPrismaClient();
    return prisma.studentProfile.findUnique({
      where: { userId }
    });
  }

  async createProfile(profileData) {
    const prisma = await getPrismaClient();
    return prisma.studentProfile.create({
      data: {
        userId: profileData.userId,
        fullName: profileData.fullName,
        university: profileData.university,
        fieldOfStudy: profileData.fieldOfStudy,
        currentEducationLevel: profileData.currentEducationLevel,
        targetEducationLevels: profileData.targetEducationLevels,
        gpa: profileData.gpa,
        country: profileData.country,
        preferredLang: profileData.preferredLang
      }
    });
  }

  async updateProfile(userId, updates) {
    const prisma = await getPrismaClient();
    return prisma.studentProfile.update({
      where: { userId },
      data: {
        ...(updates.fullName !== undefined && { fullName: updates.fullName }),
        ...(updates.university !== undefined && { university: updates.university }),
        ...(updates.fieldOfStudy !== undefined && { fieldOfStudy: updates.fieldOfStudy }),
        ...(updates.currentEducationLevel !== undefined && { currentEducationLevel: updates.currentEducationLevel }),
        ...(updates.targetEducationLevels !== undefined && { targetEducationLevels: updates.targetEducationLevels }),
        ...(updates.gpa !== undefined && { gpa: updates.gpa }),
        ...(updates.country !== undefined && { country: updates.country }),
        ...(updates.preferredLang !== undefined && { preferredLang: updates.preferredLang })
      }
    });
  }
}

