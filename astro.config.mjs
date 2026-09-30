import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  build: { format: 'directory' },
  server: { host: '0.0.0.0' },
});
