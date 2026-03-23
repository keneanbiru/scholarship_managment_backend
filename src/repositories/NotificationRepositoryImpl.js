import { getPrismaClient } from '../infrastructure/database/prismaClient.js';

export class NotificationRepositoryImpl {
  async create({ userId, title, message }) {
    const prisma = await getPrismaClient();
    return prisma.notification.create({
      data: {
        userId,
        title,
        message
      }
    });
  }
}

