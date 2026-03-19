// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
    site: 'https://github.com/Design-Wise-Gold/Landing_WiseGold',   
    base: '/Landing_WiseGold',
	vite: {
		plugins: [tailwindcss()],
	},
});
