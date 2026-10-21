import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [cloudflare()],
  base: './', // Caminhos relativos para compatibilidade com GitHub Pages e subdiretórios
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
