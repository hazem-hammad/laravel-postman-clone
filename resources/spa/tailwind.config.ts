import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--pc-primary)',
        'primary-text': 'var(--pc-primary-text)',
      },
    },
  },
  plugins: [],
};

export default config;
