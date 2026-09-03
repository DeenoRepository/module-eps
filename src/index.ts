export * from './domain/equipment-service.js';
export * from './domain/equipment-aggregate.js';

export const EpsModule = {
  id: 'module-eps',
  version: '1.0.0',
  async onInit(ctx: any) {
    ctx.registerNavigation({
      id: 'eps-menu',
      title: 'Equipment Passports',
      path: '/eps',
      permission: 'eps:equipment:read'
    });
  },
  async onStart() {},
  async onStop() {}
};
