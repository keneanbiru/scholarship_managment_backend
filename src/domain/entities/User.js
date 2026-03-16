import { Role } from '../valueObjects/Role.js';

// User Entity
export class User {
  constructor({
    id,
    email,
    passwordHash,
    role,
    isActive = true,
    createdById = null,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role instanceof Role ? role : new Role(role);
    this.isActive = isActive;
    this.createdById = createdById;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isStudent() {
    return this.role.isStudent();
  }

  isAdmin() {
    return this.role.isAdmin();
  }

  isOwner() {
    return this.role.isOwner();
  }

  isManager() {
    return this.role.isManager();
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role.toString(),
      isActive: this.isActive,
      createdById: this.createdById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Exclude password hash from JSON
  toPublicJSON() {
    const json = this.toJSON();
    delete json.passwordHash;
    return json;
  }
}
