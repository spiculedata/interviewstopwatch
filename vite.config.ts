import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
	],
	server: {
		cors: {
			origin: ['https://interview-stopwatch.internal.researchaccelerator.org/', 'http://localhost:5173'],
			methods: ['GET', 'POST'],
			allowedHeaders: ['Content-Type']
		},
		allowedHosts: ['.internal.researchaccelerator.org'] //starting with . allows wildcard for all subdomains
	}
});
