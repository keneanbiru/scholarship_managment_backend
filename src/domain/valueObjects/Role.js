// Role Value Object
export class Role {
  constructor(value) {
    const validRoles = ['STUDENT', 'MANAGER', 'OWNER', 'ADMIN'];
    
    if (!validRoles.includes(value)) {
      throw new Error(`Invalid role: ${value}. Must be one of: ${validRoles.join(', ')}`);
    }
    
    this.value = value;
  }

  static STUDENT = new Role('STUDENT');
  static MANAGER = new Role('MANAGER');
  static OWNER = new Role('OWNER');
  static ADMIN = new Role('ADMIN');

  equals(other) {
    return other instanceof Role && this.value === other.value;
  }

  toString() {
    return this.value;
  }

  isStudent() {
    return this.value === 'STUDENT';
  }

  isAdmin() {
    return this.value === 'ADMIN';
  }

  isOwner() {
    return this.value === 'OWNER';
  }

  isManager() {
    return this.value === 'MANAGER';
  }
}

