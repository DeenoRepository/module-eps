import { describe, it, expect } from 'vitest';
import {
  validateTechnicalSpecifications,
  CanonicalTechnicalSpecsSchema,
  EquipmentPassportSchema,
  CustomFieldDefinition,
  STANDARD_SECTIONS,
  CANONICAL_SPECS,
} from './technical-specifications.js';

describe('Technical Specifications & Zod Validation', () => {
  it('has standard sections and canonical specifications configured', () => {
    expect(STANDARD_SECTIONS.length).toBe(6);
    expect(CANONICAL_SPECS.length).toBeGreaterThanOrEqual(26);
    expect(STANDARD_SECTIONS.some((s) => s.code === 'classifiers')).toBe(true);
    expect(CANONICAL_SPECS.some((c) => c.key === 'actual_wear_percentage')).toBe(true);
  });

  it('validates a complete and correct canonical technical specifications object', () => {
    const input = {
      decimal_number: 'АБВГ.123456.001',
      okof_code: '330.28.29',
      prod_year: 2020,
      comm_year: 2021,
      equipment_age: 5,
      actual_wear_percentage: 35.5,
      criticality: 'A',
      is_unique: true,
      is_imported: false,
      maintenance_periodicity: 'Quarterly',
      to_count_scheduled: 4,
      operating_voltage: '380V',
      power_kw: 15.5,
      nominal_current: 32,
      phase_count: 3,
      operating_pressure: 1.6,
      rotation_speed: 1500,
      is_critical_path: true,
      calibration_interval: 12,
    };

    const result = validateTechnicalSpecifications(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.validatedData.power_kw).toBe(15.5);
    expect(result.validatedData.actual_wear_percentage).toBe(35.5);
  });

  it('rejects commission year earlier than production year', () => {
    const input = {
      prod_year: 2022,
      comm_year: 2019,
    };

    const result = validateTechnicalSpecifications(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Commission year cannot precede production year'))).toBe(true);
  });

  it('rejects invalid wear percentage outside 0-100', () => {
    const resultNegative = validateTechnicalSpecifications({ actual_wear_percentage: -5 });
    expect(resultNegative.isValid).toBe(false);

    const resultExcessive = validateTechnicalSpecifications({ actual_wear_percentage: 120 });
    expect(resultExcessive.isValid).toBe(false);
  });

  it('rejects negative numbers for power, pressure, rotation speed and current', () => {
    const result = validateTechnicalSpecifications({
      power_kw: -10,
      operating_pressure: -2,
      rotation_speed: -500,
      nominal_current: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('coerces stringified numbers and handles comma decimal separators', () => {
    const input = {
      power_kw: '45,7 кВт',
      operating_pressure: '6,2',
      actual_wear_percentage: '25%',
    };

    const result = validateTechnicalSpecifications(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedData.power_kw).toBe(45.7);
    expect(result.validatedData.operating_pressure).toBe(6.2);
    expect(result.validatedData.actual_wear_percentage).toBe(25);
  });

  it('coerces boolean variations like yes/no, 1/0, да/нет', () => {
    const input = {
      is_unique: 'да',
      is_imported: '0',
      is_critical_path: 'true',
    };

    const result = validateTechnicalSpecifications(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedData.is_unique).toBe(true);
    expect(result.validatedData.is_imported).toBe(false);
    expect(result.validatedData.is_critical_path).toBe(true);
  });

  it('validates custom dynamic field definitions including required and select options', () => {
    const customDefs: CustomFieldDefinition[] = [
      {
        key: 'lubricant_spec',
        name: 'Спецификация масла',
        fieldType: 'SELECT',
        options: ['ISO VG 32', 'ISO VG 46', 'ISO VG 68'],
        isRequired: true,
      },
      {
        key: 'inspection_due',
        name: 'Дата следующего освидетельствования',
        fieldType: 'DATE',
      },
    ];

    // Missing required field
    const invalidResult = validateTechnicalSpecifications({}, customDefs);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.some((e) => e.field === 'lubricant_spec')).toBe(true);

    // Invalid select option
    const wrongOptionResult = validateTechnicalSpecifications(
      { lubricant_spec: 'UNKNOWN-OIL' },
      customDefs
    );
    expect(wrongOptionResult.isValid).toBe(false);
    expect(wrongOptionResult.errors.some((e) => e.message.includes('must be one of'))).toBe(true);

    // Valid dynamic fields
    const validResult = validateTechnicalSpecifications(
      {
        lubricant_spec: 'ISO VG 46',
        inspection_due: '2026-12-31T00:00:00Z',
      },
      customDefs
    );
    expect(validResult.isValid).toBe(true);
    expect(validResult.validatedData.lubricant_spec).toBe('ISO VG 46');
  });

  it('validates entire EquipmentPassportSchema', () => {
    const validPassport = {
      id: 'EQ-001',
      inventoryNumber: 'INV-2026-001',
      name: 'Milling Machine CNC',
      category: 'Machining',
      location: 'Workshop A',
      initialCost: 2500000,
      lifespanYears: 12,
      status: 'ACTIVE',
      serialNumber: 'CNC-9842',
      manufacturer: 'DMG Mori',
      model: 'DMU 50',
      commissionDate: '2026-01-15',
      technicalSpecifications: {
        power_kw: 22,
        rotation_speed: 12000,
      },
    };

    const parsed = EquipmentPassportSchema.safeParse(validPassport);
    expect(parsed.success).toBe(true);

    const invalidPassport = {
      ...validPassport,
      initialCost: -100, // Negative cost
      lifespanYears: 0, // Zero lifespan
    };
    const invalidParsed = EquipmentPassportSchema.safeParse(invalidPassport);
    expect(invalidParsed.success).toBe(false);
  });
});
