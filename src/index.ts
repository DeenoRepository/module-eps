export * from './domain/equipment-service.js';

export const EpsModule = {
  id: 'module-eps',
  version: '1.0.0',
  async onInit(ctx: any) {
    ctx.registerNavigation({
      id: 'eps-menu',
      title: 'РџР°СЃРїРѕСЂС‚Р° РѕР±РѕСЂСѓРґРѕРІР°РЅРёСЏ',
      path: '/eps',
      permission: 'eps:equipment:read'
    });
  },
  async onStart() {},
  async onStop() {}
};
