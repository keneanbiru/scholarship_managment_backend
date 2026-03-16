import app from './app.js';
import { env } from './config/env.js';
import { getPrismaClient, disconnectPrisma } from './infrastructure/database/prismaClient.js';

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await getPrismaClient();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    // Don't exit in development, allow server to start
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${env.PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${env.PORT}/api/auth`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        await disconnectPrisma();
        console.log('Database connection closed');
        
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
