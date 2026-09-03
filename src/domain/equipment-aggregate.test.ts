import { describe, it, expect } from 'vitest';
import { EquipmentAggregate } from './equipment-aggregate.js';

describe('EquipmentAggregate Domain & Outbox (TDD)', () => {
  it('creates aggregate in DRAFT state and generates outbox event', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-100',
      inventoryNumber: 'INV-2026-001',
      name: 'Hydraulic Press',
      category: 'Heavy Machinery',
      location: 'Workshop 1',
      initialCost: 500000,
      lifespanYears: 10
    });

    expect(equipment.props.status).toBe('DRAFT');
    expect(equipment.outboxEvents).toHaveLength(1);
    expect(equipment.outboxEvents[0].eventType).toBe('eps.equipment.created');
    expect(equipment.outboxEvents[0].payload.name).toBe('Hydraulic Press');
  });

  it('handles state transition to ACTIVE with activation event', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-101',
      inventoryNumber: 'INV-2026-002',
      name: 'Centrifuge',
      category: 'Laboratory',
      location: 'Lab 3',
      initialCost: 150000,
      lifespanYears: 5
    });

    equipment.activate();
    expect(equipment.props.status).toBe('ACTIVE');
    expect(equipment.outboxEvents).toHaveLength(2);
    expect(equipment.outboxEvents[1].eventType).toBe('eps.equipment.activated');
  });

  it('transitions from ACTIVE to MAINTENANCE and emits maintenance event', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-102',
      inventoryNumber: 'INV-2026-003',
      name: 'Turbine',
      category: 'Energy',
      location: 'Power Station',
      initialCost: 1000000,
      lifespanYears: 15
    });

    equipment.activate();
    equipment.sendToMaintenance('Scheduled 500h maintenance');
    expect(equipment.props.status).toBe('MAINTENANCE');
    expect(equipment.outboxEvents[2].eventType).toBe('eps.equipment.maintenance_started');
  });

  it('rejects maintenance transition if equipment is not in ACTIVE state', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-103',
      inventoryNumber: 'INV-2026-004',
      name: 'Lathe',
      category: 'Milling',
      location: 'Shop 2',
      initialCost: 80000,
      lifespanYears: 8
    });

    expect(() => equipment.sendToMaintenance('Test')).toThrow('Equipment must be ACTIVE');
  });
});
