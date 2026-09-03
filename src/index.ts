export * from './domain/equipment-service.js';
export * from './domain/equipment-aggregate.js';
export * from './domain/technical-specifications.js';
export * from './domain/custom-attributes-parser.js';
export * from './domain/equipment-qr-generator.js';

export const EpsModule = {
  id: 'module-eps',
  version: '1.0.0',
  async onInit(ctx: { registerNavigation: (nav: { id: string; title: string; path: string; permission: string }) => void }) {
    ctx.registerNavigation({
      id: 'eps-menu',
      title: 'Equipment Passports',
      path: '/eps',
      permission: 'eps:equipment:read',
    });
  },
  async onStart() {},
  async onStop() {},
};
