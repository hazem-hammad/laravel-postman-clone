import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--pc-primary)',
        'primary-text': 'var(--pc-primary-text)',
        accent: 'var(--pc-accent)',
        'accent-hover': 'var(--pc-accent-hover)',
        'accent-text': 'var(--pc-accent-text)',

        app: 'var(--pc-bg)',
        surface: 'var(--pc-surface)',
        'surface-2': 'var(--pc-surface-2)',
        'surface-3': 'var(--pc-surface-3)',
        'surface-hover': 'var(--pc-surface-hover)',

        line: 'var(--pc-border)',
        'line-subtle': 'var(--pc-border-subtle)',

        fg: 'var(--pc-fg)',
        'fg-muted': 'var(--pc-fg-muted)',
        'fg-subtle': 'var(--pc-fg-subtle)',
        'fg-inverse': 'var(--pc-fg-inverse)',

        'method-get': 'var(--pc-method-get)',
        'method-post': 'var(--pc-method-post)',
        'method-put': 'var(--pc-method-put)',
        'method-patch': 'var(--pc-method-patch)',
        'method-delete': 'var(--pc-method-delete)',
        'method-head': 'var(--pc-method-head)',
        'method-options': 'var(--pc-method-options)',

        'status-success': 'var(--pc-status-success)',
        'status-success-bg': 'var(--pc-status-success-bg)',
        'status-warn': 'var(--pc-status-warn)',
        'status-warn-bg': 'var(--pc-status-warn-bg)',
        'status-error': 'var(--pc-status-error)',
        'status-error-bg': 'var(--pc-status-error-bg)',
        'status-info': 'var(--pc-status-info)',
        'status-info-bg': 'var(--pc-status-info-bg)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
