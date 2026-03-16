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
}

