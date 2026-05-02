import '@testing-library/jest-dom/vitest';

(globalThis as any).window ||= {};
(window as any).__POSTMAN_CLONE__ = {
  theme: { primary_color: '#0B5FFF', primary_text: '#FFFFFF', app_name: 'Postman Clone' },
  route_prefix: 'postman',
};
