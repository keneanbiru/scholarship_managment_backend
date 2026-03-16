// FundingType Value Object
export class FundingType {
  constructor(value) {
    const validTypes = ['FULLY_FUNDED', 'PARTIALLY_FUNDED', 'SELF_FUNDED'];
    
    if (!validTypes.includes(value)) {
      throw new Error(`Invalid funding type: ${value}. Must be one of: ${validTypes.join(', ')}`);
    }
    
    this.value = value;
  }

  static FULLY_FUNDED = new FundingType('FULLY_FUNDED');
  static PARTIALLY_FUNDED = new FundingType('PARTIALLY_FUNDED');
  static SELF_FUNDED = new FundingType('SELF_FUNDED');

  equals(other) {
    return other instanceof FundingType && this.value === other.value;
  }

  toString() {
    return this.value;
  }
}

