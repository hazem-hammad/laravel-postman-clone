import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': path.resolve(__dirname, 'src') },
    },
    base: '/postman/dist/',
    build: {
        outDir: path.resolve(__dirname, '../dist'),
        emptyOutDir: true,
        manifest: 'manifest.json',
        rollupOptions: {
            input: path.resolve(__dirname, 'src/main.tsx'),
        },
    },
    server: {
        port: 5173,
    },
});
