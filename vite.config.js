import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/content.js'),
        popup: resolve(__dirname, 'src/popup/popup.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    // Don't minify for easier debugging
    minify: false,
    sourcemap: false
  },
  // Copy static assets
  publicDir: 'src/public',
  define: {
    // Ensure we can access Chrome APIs
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});
