import { describe, it, expect } from 'vitest';
import { EquipmentService } from './equipment-service.js';

describe('EquipmentService (TDD)', () => {
  const service = new EquipmentService();

  it('generates standard inventory numbers', () => {
    const num = service.generateInventoryNumber('MEC', 42);
    expect(num).toMatch(/^EQ-MEC-\d{4}-00042$/);
  });

  it('calculates linear depreciation wear correctly', () => {
    const residual = service.calculateDepreciationWear(100000, 5, 10);
    expect(residual).toBe(50000);
  });

  it('caps residual value to 0 when lifespan exceeded', () => {
    const residual = service.calculateDepreciationWear(100000, 15, 10);
    expect(residual).toBe(0);
  });
});
