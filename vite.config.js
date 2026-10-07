import { defineConfig } from 'vite';

// base './' = path relatif, jadi hasil build bisa langsung jalan di
// https://<user>.github.io/<nama-repo>/ apa pun nama repo-nya.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
