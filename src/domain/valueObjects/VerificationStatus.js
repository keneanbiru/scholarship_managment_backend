// VerificationStatus Value Object
export class VerificationStatus {
  constructor(value) {
    const validStatuses = ['PENDING', 'VERIFIED', 'EXPIRED'];
    
    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid verification status: ${value}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    this.value = value;
  }

  static PENDING = new VerificationStatus('PENDING');
  static VERIFIED = new VerificationStatus('VERIFIED');
  static EXPIRED = new VerificationStatus('EXPIRED');

  equals(other) {
    return other instanceof VerificationStatus && this.value === other.value;
  }

  toString() {
    return this.value;
  }
}

