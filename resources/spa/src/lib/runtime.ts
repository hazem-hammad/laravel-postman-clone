export type Theme = {
  primary_color: string;
  primary_text: string;
  app_name: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  default_mode?: 'light' | 'dark' | 'system';
};

export type Runtime = {
  theme: Theme;
  route_prefix: string;
};

declare global {
  interface Window {
    __POSTMAN_CLONE__: Runtime;
  }
}

export function getRuntime(): Runtime {
  if (typeof window === 'undefined' || !window.__POSTMAN_CLONE__) {
    throw new Error('window.__POSTMAN_CLONE__ not set — Blade shell did not bootstrap the SPA.');
  }
  return window.__POSTMAN_CLONE__;
}

export function getApiBase(): string {
  const { route_prefix } = getRuntime();
  return `/${route_prefix}/api`;
}
