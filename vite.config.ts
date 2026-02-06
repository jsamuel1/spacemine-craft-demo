import { defineConfig } from 'vite';

export default defineConfig({
  base: '/spacemine-craft-demo/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
});
