// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://wise.gold',
  output: 'server',
  adapter: node({ mode: 'middleware' }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
