// Prisma Client wrapper
// Note: This will work after running 'npx prisma generate'
// For now, we'll create a placeholder that will be properly initialized after migration

let prismaClient = null;

export const getPrismaClient = async () => {
  if (!prismaClient) {
    try {
      // Dynamic import to handle case where Prisma hasn't been generated yet
      const { PrismaClient } = await import('@prisma/client');
      prismaClient = new PrismaClient();
      
      // Connect to database
      await prismaClient.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Prisma Client:', error.message);
      console.log('⚠️  Make sure to run: npx prisma generate && npx prisma migrate dev');
      // Return a mock client for development (will fail on actual DB operations)
      prismaClient = {
        $connect: async () => {},
        $disconnect: async () => {},
        user: {
          findUnique: async () => null,
          findMany: async () => [],
          create: async () => { throw new Error('Prisma not initialized. Run: npx prisma generate'); },
          update: async () => { throw new Error('Prisma not initialized. Run: npx prisma generate'); },
        }
      };
    }
  }
  
  return prismaClient;
};

export const disconnectPrisma = async () => {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
};

