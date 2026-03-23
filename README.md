# Scholarship Management System - Backend

A Node.js backend application for managing scholarships with AI-powered recommendations, built using Express.js, PostgreSQL, and Prisma.

## Role System

The platform uses a 4-role model:

- `ADMIN`: system-level control, can manage all users and resources
- `OWNER`: business owner role, can create managers and manage scholarships
- `MANAGER`: can manage scholarships they create
- `STUDENT`: can discover scholarships, bookmark, and apply

## Architecture

This project follows Clean Architecture principles with clear separation of concerns:

- **Domain Layer**: Entities, Value Objects, and Repository Interfaces
- **Use Cases**: Business logic for each feature
- **Infrastructure**: Database, AI clients, authentication, and external services
- **Controllers**: HTTP request handlers
- **Routes**: API endpoint definitions

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="postgresql://user:password@localhost:5432/scholarship_db"
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=24h
   ```

4. Set up Prisma:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

## Running the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout and invalidate tokens
- `POST /api/auth/password-reset-request` - Request a password reset token
- `POST /api/auth/password-reset` - Reset password with token
- `POST /api/auth/refresh-token` - Exchange refresh token for new tokens
- `GET /api/auth/oauth/google` - Start Google OAuth flow
- `GET /api/auth/oauth/google/callback` - Google OAuth callback
- `GET /api/auth/oauth/linkedin` - Start LinkedIn OAuth flow
- `GET /api/auth/oauth/linkedin/callback` - LinkedIn OAuth callback
- `GET /api/auth/me` - Get current user profile (protected)
- `GET /api/auth/profile` - Backward-compatible profile endpoint (protected)

### Scholarships (Milestone 4)

- `POST /api/scholarships` - Create scholarship (`ADMIN`, `OWNER`, `MANAGER`)
- `GET /api/scholarships` - List scholarships with pagination/filters (`page`, `limit`, `search`, `status`, `country`)
- `GET /api/scholarships/:id` - Get scholarship details
- `PUT /api/scholarships/:id` - Update scholarship (`ADMIN`, owner-scope, manager-own)
- `DELETE /api/scholarships/:id` - Soft delete/archive scholarship (`ADMIN`, owner-scope, manager-own)
- `GET /api/scholarships/my-scholarships` - List own/scoped scholarships (`OWNER`, `MANAGER`)
- `POST /api/scholarships/:id/documents` - Upload scholarship document (`multipart/form-data`, field name: `file`)

### Example Request (Register)

```json
POST /api/auth/register
{
  "email": "student@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

### Example Request (Login)

```json
POST /api/auth/login
{
  "email": "student@example.com",
  "password": "password123"
}
```

## Project Structure

```
src/
├── domain/           # Domain entities and value objects
├── usecases/         # Business logic use cases
├── repositories/     # Data access implementations
├── controllers/      # HTTP request handlers
├── routes/           # API route definitions
├── infrastructure/   # External services and database
├── middlewares/      # Express middlewares
├── config/           # Configuration files
├── app.js            # Express app setup
└── server.js         # Server entry point
```

## Development

- The project uses ES6 modules (`"type": "module"` in package.json)
- Prisma is used for database ORM
- JWT is used for authentication
- bcrypt is used for password hashing

## License

ISC

