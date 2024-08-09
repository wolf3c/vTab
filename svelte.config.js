import adapter from '@sveltejs/adapter-auto';
// import adapter from 'sveltekit-adapter-chrome-extension';
// import { vitePreprocess } from '@sveltejs/kit/vite';


/** @type {import('@sveltejs/kit').Config} */
const config = {
    // preprocess: vitePreprocess(),
    kit: {
        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        // adapter: adapter()
        // adapter: adapter({
        //     pages: "build",
        //     assets: "build",
        //     fallback: null,
        //     precompress: false,
        //     manifest: "manifest.json",
        // }),
        appDir: 'app',
        adapter: adapter({ strict: true }), // Required
		csp: { directives: { 'script-src': ['self'] } }, // optional
    }
};

export default config;
