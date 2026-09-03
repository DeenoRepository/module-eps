import { EquipmentAggregate, EquipmentProps } from './equipment-aggregate.js';
import { parseEquipmentCustomAttributes } from './custom-attributes-parser.js';
import { validateTechnicalSpecifications } from './technical-specifications.js';
import { generateEquipmentThermalLabelSvg } from './equipment-qr-generator.js';

export class EquipmentService {
  generateInventoryNumber(deptCode: string, sequence: number): string {
    const year = new Date().getFullYear();
    const padSeq = sequence.toString().padStart(5, '0');
    return `EQ-${deptCode}-${year}-${padSeq}`;
  }

  calculateDepreciationWear(initialCost: number, yearsInUse: number, lifespanYears: number): number {
    if (lifespanYears <= 0) throw new Error('Lifespan must be positive');
    if (yearsInUse < 0) throw new Error('Years in use cannot be negative');
    const wearRatio = Math.min(1.0, yearsInUse / lifespanYears);
    return Math.round(initialCost * (1 - wearRatio) * 100) / 100;
  }

  calculateActualWearPercentage(commissionDate: string | Date, lifespanYears: number, currentDate = new Date()): number {
    if (lifespanYears <= 0) throw new Error('Lifespan must be positive');
    const start = new Date(commissionDate);
    if (Number.isNaN(start.getTime())) throw new Error('Invalid commission date');

    const diffMs = currentDate.getTime() - start.getTime();
    if (diffMs <= 0) return 0;

    const yearsInUse = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    const percentage = Math.min(100, Math.round((yearsInUse / lifespanYears) * 100 * 10) / 10);
    return Math.max(0, percentage);
  }

  parseLegacyPassport(rawRecord: Record<string, unknown>): {
    equipmentProps: Omit<EquipmentProps, 'status'>;
    canonicalAttributes: Record<string, unknown>;
  } {
    const parsedAttrs = parseEquipmentCustomAttributes(rawRecord);
    const id = String(rawRecord.id || rawRecord.equipmentId || crypto.randomUUID());
    const inventoryNumber = parsedAttrs.extractedBaseFields.inventoryNumber || String(rawRecord.inventoryNumber || `EQ-AUTO-${Date.now()}`);
    const name = parsedAttrs.extractedBaseFields.name || String(rawRecord.name || 'Unnamed Equipment');
    const category = String(rawRecord.category || 'General Equipment');
    const location = parsedAttrs.extractedBaseFields.location || String(rawRecord.location || 'Default Workshop');
    const initialCost = typeof rawRecord.initialCost === 'number' ? rawRecord.initialCost : 0;
    const lifespanYears = typeof rawRecord.lifespanYears === 'number' && rawRecord.lifespanYears > 0 ? rawRecord.lifespanYears : 10;

    const validation = validateTechnicalSpecifications(parsedAttrs.canonicalAttributes);

    return {
      equipmentProps: {
        id,
        inventoryNumber,
        name,
        category,
        location,
        initialCost,
        lifespanYears,
        serialNumber: parsedAttrs.extractedBaseFields.serialNumber || (rawRecord.serialNumber as string | undefined),
        manufacturer: parsedAttrs.extractedBaseFields.manufacturer || (rawRecord.manufacturer as string | undefined),
        model: parsedAttrs.extractedBaseFields.model || (rawRecord.model as string | undefined),
        commissionDate: parsedAttrs.extractedBaseFields.commissionDate || (rawRecord.commissionDate as string | undefined),
        technicalSpecifications: validation.validatedData,
      },
      canonicalAttributes: validation.validatedData,
    };
  }

  generateThermalLabel(aggregate: EquipmentAggregate, format: '58mm' | '80mm' = '58mm', baseUrl?: string): string {
    return generateEquipmentThermalLabelSvg({
      equipmentId: aggregate.props.id,
      inventoryNumber: aggregate.props.inventoryNumber,
      name: aggregate.props.name,
      serialNumber: aggregate.props.serialNumber || undefined,
      location: aggregate.props.location,
      labelFormat: format,
      baseUrl,
    });
  }
}
