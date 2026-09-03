import { describe, it, expect } from 'vitest';
import {
  EpsModule,
  EquipmentAggregate,
  EquipmentService,
  validateTechnicalSpecifications,
  parseEquipmentCustomAttributes,
  generateEquipmentQrSvg,
} from './index.js';

describe('EpsModule Entrypoint', () => {
  it('exports all domain classes and utilities', () => {
    expect(EquipmentAggregate).toBeDefined();
    expect(EquipmentService).toBeDefined();
    expect(validateTechnicalSpecifications).toBeDefined();
    expect(parseEquipmentCustomAttributes).toBeDefined();
    expect(generateEquipmentQrSvg).toBeDefined();
  });

  it('initializes module lifecycle hooks', async () => {
    let registeredNav: unknown = null;
    const ctx = {
      registerNavigation: (nav: unknown) => {
        registeredNav = nav;
      },
    };

    await EpsModule.onInit(ctx);
    expect(registeredNav).toEqual({
      id: 'eps-menu',
      title: 'Equipment Passports',
      path: '/eps',
      permission: 'eps:equipment:read',
    });

    await expect(EpsModule.onStart()).resolves.toBeUndefined();
    await expect(EpsModule.onStop()).resolves.toBeUndefined();
  });
});
