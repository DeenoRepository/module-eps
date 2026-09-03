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
      lifespanYears: 10,
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
      lifespanYears: 5,
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
      lifespanYears: 15,
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
      lifespanYears: 8,
    });

    expect(() => equipment.sendToMaintenance('Test')).toThrow('Equipment must be ACTIVE');
  });

  it('decommissions equipment and rejects further state changes', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-104',
      inventoryNumber: 'INV-2026-005',
      name: 'Old Boiler',
      category: 'Heating',
      location: 'Boiler Room',
      initialCost: 200000,
      lifespanYears: 20,
    });

    equipment.decommission('End of operational life');
    expect(equipment.props.status).toBe('DECOMMISSIONED');
    expect(() => equipment.activate()).toThrow('Cannot activate decommissioned equipment');
    expect(() => equipment.updateDetails({ name: 'Renamed Boiler' })).toThrow('Cannot update decommissioned equipment');
    expect(() => equipment.updateTechnicalSpecifications({ power_kw: 50 })).toThrow('Cannot update technical specifications');
  });

  it('updates equipment details and technical specifications with outbox events', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-105',
      inventoryNumber: 'INV-2026-006',
      name: 'Industrial Robot',
      category: 'Robotics',
      location: 'Line A',
      initialCost: 4000000,
      lifespanYears: 10,
    });

    equipment.updateDetails({
      location: 'Line B',
      manufacturer: 'KUKA',
      model: 'KR 210',
    });

    expect(equipment.props.location).toBe('Line B');
    expect(equipment.props.manufacturer).toBe('KUKA');
    expect(equipment.props.model).toBe('KR 210');

    equipment.updateTechnicalSpecifications({
      power_kw: 15,
      nominal_current: 30,
      is_unique: true,
    });

    expect(equipment.props.technicalSpecifications?.power_kw).toBe(15);
    expect(equipment.props.technicalSpecifications?.is_unique).toBe(true);

    const specEvent = equipment.outboxEvents.find((e) => e.eventType === 'eps.equipment.technical_specs_updated');
    expect(specEvent).toBeDefined();
    expect(specEvent?.payload.equipmentId).toBe('EQ-105');
  });

  it('throws when technical specifications validation fails', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-106',
      inventoryNumber: 'INV-2026-007',
      name: 'Compressor',
      category: 'Pneumatics',
      location: 'Utility Room',
      initialCost: 60000,
      lifespanYears: 5,
    });

    expect(() =>
      equipment.updateTechnicalSpecifications({
        actual_wear_percentage: 150, // Invalid!
      })
    ).toThrow('Technical specifications validation failed');
  });

  it('imports raw custom attributes, auto-populating missing base fields and normalizing attributes', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-107',
      inventoryNumber: 'INV-2026-008',
      name: 'Electric Furnace',
      category: 'Thermal',
      location: 'Foundry',
      initialCost: 1200000,
      lifespanYears: 15,
    });

    equipment.importCustomAttributes({
      zavodskoy_nomer: 'SN-HEAT-771',
      proizvoditel: 'Nabertherm',
      model_modifikatsiya: 'N 100/14',
      rabochee_napryazhenie: '400V',
      nominalnaya_moschnost: '25 кВт',
      fakticheskiy_protsent_iznosa: '10 %',
      unikalnoe_oborudovanie: 'Да',
    });

    expect(equipment.props.serialNumber).toBe('SN-HEAT-771');
    expect(equipment.props.manufacturer).toBe('Nabertherm');
    expect(equipment.props.model).toBe('N 100/14');
    expect(equipment.props.technicalSpecifications?.power_kw).toBe(25);
    expect(equipment.props.technicalSpecifications?.actual_wear_percentage).toBe(10);
    expect(equipment.props.technicalSpecifications?.is_unique).toBe(true);
  });

  it('generates QR payloads, QR SVG and thermal labels', () => {
    const equipment = EquipmentAggregate.create({
      id: 'EQ-108',
      inventoryNumber: 'INV-2026-009',
      name: 'Air Handling Unit',
      category: 'HVAC',
      location: 'Roof A',
      initialCost: 350000,
      lifespanYears: 12,
    });

    const uriPayload = equipment.generateQrPayload('https://ems.corp');
    expect(uriPayload).toBe('https://ems.corp/eps/equipment/EQ-108?inv=INV-2026-009');

    const jsonPayload = equipment.generateQrPayload(undefined, 'json');
    expect(jsonPayload).toContain('"id":"EQ-108"');

    const qrSvg = equipment.generateQrSvg({ size: 180 });
    expect(qrSvg).toContain('<svg');
    expect(qrSvg).toContain('width="180"');

    const label58 = equipment.generateThermalLabelSvg('58mm');
    expect(label58).toContain('EMS ENTERPRISE EPS');
    expect(label58).toContain('INV-2026-009');

    const label80 = equipment.generateThermalLabelSvg('80mm');
    expect(label80).toContain('width="320"');

    equipment.clearOutbox();
    expect(equipment.outboxEvents).toHaveLength(0);
  });
});
