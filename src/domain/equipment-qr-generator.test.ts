import { describe, it, expect } from 'vitest';
import {
  formatEquipmentQrPayload,
  parseEquipmentQrPayload,
  generateQrMatrix,
  generateEquipmentQrSvg,
  generateEquipmentThermalLabelSvg,
} from './equipment-qr-generator.js';

describe('Equipment QR Code Generator & Label Renderer', () => {
  it('formats standardized canonical URI and JSON payloads', () => {
    const uriPayload = formatEquipmentQrPayload({
      equipmentId: 'EQ-100',
      inventoryNumber: 'INV-2026-001',
      serialNumber: 'SN-991',
      baseUrl: 'https://ems.example.com',
    });
    expect(uriPayload).toBe('https://ems.example.com/eps/equipment/EQ-100?inv=INV-2026-001&sn=SN-991');

    const jsonPayload = formatEquipmentQrPayload({
      equipmentId: 'EQ-100',
      inventoryNumber: 'INV-2026-001',
      serialNumber: 'SN-991',
      name: 'Hydraulic Pump',
      format: 'json',
    });
    expect(jsonPayload).toContain('"schema":"eps.v1"');
    expect(jsonPayload).toContain('"id":"EQ-100"');
    expect(jsonPayload).toContain('"inv":"INV-2026-001"');
    expect(jsonPayload).toContain('"sn":"SN-991"');
  });

  it('parses both URI and JSON QR payloads correctly', () => {
    // URI parsing
    const parsedUri = parseEquipmentQrPayload('https://ems.corp.internal/eps/equipment/EQ-777?inv=INV-777&sn=SN-777');
    expect(parsedUri).not.toBeNull();
    expect(parsedUri?.equipmentId).toBe('EQ-777');
    expect(parsedUri?.inventoryNumber).toBe('INV-777');
    expect(parsedUri?.serialNumber).toBe('SN-777');

    // JSON parsing
    const jsonStr = JSON.stringify({
      schema: 'eps.v1',
      id: 'EQ-888',
      inv: 'INV-888',
      name: 'Laser Cutter',
      sn: 'LC-01',
    });
    const parsedJson = parseEquipmentQrPayload(jsonStr);
    expect(parsedJson).not.toBeNull();
    expect(parsedJson?.equipmentId).toBe('EQ-888');
    expect(parsedJson?.inventoryNumber).toBe('INV-888');
    expect(parsedJson?.name).toBe('Laser Cutter');
    expect(parsedJson?.serialNumber).toBe('LC-01');

    // Invalid input
    expect(parseEquipmentQrPayload('')).toBeNull();
    expect(parseEquipmentQrPayload('random string')).toBeNull();
    expect(parseEquipmentQrPayload('{"random":"data"}')).toBeNull();
  });

  it('generates valid QR matrix with correct dimensions and patterns', () => {
    // Short string fits in Version 1 (21x21) or Version 2 (25x25)
    const matrix = generateQrMatrix('EQ-100');
    expect(matrix).toBeDefined();
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0].length).toBe(matrix.length);

    // Top-left finder pattern check (7x7 with inner 3x3 dark)
    expect(matrix[0][0]).toBe(true);
    expect(matrix[0][6]).toBe(true);
    expect(matrix[6][0]).toBe(true);
    expect(matrix[6][6]).toBe(true);
    expect(matrix[1][1]).toBe(false);
    expect(matrix[3][3]).toBe(true);

    // Longer payload (Version 2 or 3)
    const longPayload = 'https://ems.platform.internal/eps/equipment/EQUIPMENT-UUID-998877665544?inv=INV-2026-LONG-001';
    const longMatrix = generateQrMatrix(longPayload);
    expect(longMatrix.length).toBeGreaterThan(21);
  });

  it('generates clean, valid SVG markup for QR code', () => {
    const svg = generateEquipmentQrSvg('EQ-PASSPORT-DATA', {
      size: 200,
      margin: 4,
      foregroundColor: '#1a365d',
      backgroundColor: '#f7fafc',
      title: 'Equipment QR Code',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('width="200"');
    expect(svg).toContain('height="200"');
    expect(svg).toContain('<title>Equipment QR Code</title>');
    expect(svg).toContain('fill="#1a365d"');
    expect(svg).toContain('fill="#f7fafc"');
    expect(svg).toContain('</svg>');
  });

  it('generates printable thermal label SVG for 58mm and 80mm formats', () => {
    const svg58 = generateEquipmentThermalLabelSvg({
      equipmentId: 'EQ-001',
      inventoryNumber: 'INV-2026-001',
      name: 'CNC Milling Center',
      serialNumber: 'SN-DMG-500',
      location: 'Shop floor 3',
      labelFormat: '58mm',
    });

    expect(svg58).toContain('EMS ENTERPRISE EPS');
    expect(svg58).toContain('INV-2026-001');
    expect(svg58).toContain('CNC Milling Center');
    expect(svg58).toContain('S/N: SN-DMG-500');
    expect(svg58).toContain('Shop floor 3');
    expect(svg58).toContain('width="240"');

    const svg80 = generateEquipmentThermalLabelSvg({
      equipmentId: 'EQ-002',
      inventoryNumber: 'INV-2026-002',
      name: 'Turbine Generator',
      labelFormat: '80mm',
    });
    expect(svg80).toContain('width="320"');
  });
});
