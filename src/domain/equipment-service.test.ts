import { describe, it, expect } from 'vitest';
import { EquipmentService } from './equipment-service.js';
import { EquipmentAggregate } from './equipment-aggregate.js';

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

  it('throws error when lifespan is invalid or years in use is negative', () => {
    expect(() => service.calculateDepreciationWear(1000, 5, 0)).toThrow('Lifespan must be positive');
    expect(() => service.calculateDepreciationWear(1000, -1, 10)).toThrow('Years in use cannot be negative');
  });

  it('calculates actual wear percentage from commission date and lifespan', () => {
    const commissionDate = new Date('2021-01-01');
    const currentDate = new Date('2026-01-01'); // 5 years later
    const wearPct = service.calculateActualWearPercentage(commissionDate, 10, currentDate);
    expect(wearPct).toBeCloseTo(50, 0);

    // Lifespan exceeded -> capped at 100%
    const wearCapped = service.calculateActualWearPercentage('2010-01-01', 10, currentDate);
    expect(wearCapped).toBe(100);

    // Future date -> 0%
    const wearFuture = service.calculateActualWearPercentage('2028-01-01', 10, currentDate);
    expect(wearFuture).toBe(0);

    // Invalid parameters
    expect(() => service.calculateActualWearPercentage('not-a-date', 10)).toThrow('Invalid commission date');
    expect(() => service.calculateActualWearPercentage('2020-01-01', 0)).toThrow('Lifespan must be positive');
  });

  it('parses legacy passports into strongly-typed equipment props and canonical attributes', () => {
    const legacyRecord = {
      equipmentId: 'LEGACY-991',
      naimenovanie_oborudovaniya: 'Centrifugal Pump',
      inventarnyy_nomer: 'INV-LEGACY-01',
      zavodskoy_nomer: 'SN-LEGACY-01',
      raspolozhenie: 'Station Alpha',
      initialCost: 200000,
      lifespanYears: 8,
      nominalnaya_moschnost: '30 кВт',
      rabochee_davlenie: '1,2 МПа',
    };

    const parsed = service.parseLegacyPassport(legacyRecord);
    expect(parsed.equipmentProps.id).toBe('LEGACY-991');
    expect(parsed.equipmentProps.name).toBe('Centrifugal Pump');
    expect(parsed.equipmentProps.inventoryNumber).toBe('INV-LEGACY-01');
    expect(parsed.equipmentProps.serialNumber).toBe('SN-LEGACY-01');
    expect(parsed.equipmentProps.location).toBe('Station Alpha');
    expect(parsed.canonicalAttributes.power_kw).toBe(30);
    expect(parsed.canonicalAttributes.operating_pressure).toBe(1.2);
  });

  it('generates thermal label for equipment aggregate', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-SERVICE-01',
      inventoryNumber: 'INV-SRV-01',
      name: 'Exhaust Fan',
      category: 'Ventilation',
      location: 'Section 4',
      initialCost: 50000,
      lifespanYears: 7,
    });

    const labelSvg = service.generateThermalLabel(equipment, '58mm');
    expect(labelSvg).toContain('INV-SRV-01');
    expect(labelSvg).toContain('Exhaust Fan');
    expect(labelSvg).toContain('EMS ENTERPRISE EPS');
  });
});
