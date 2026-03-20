import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    plugins: [
        react(),
        laravel({
            input: ['resources/js/main.jsx', 'resources/js/index.css'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    define: {
        'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000/api'),
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});