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
}
