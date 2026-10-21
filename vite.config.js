import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Caminhos relativos para compatibilidade com GitHub Pages e subdiretórios
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
