import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
    plugins: [svelte(), crx({ manifest })],


    // plugins: [
    //     sveltekit(),
    //     crx({ manifest }),
    //     {
    //         name: 'mergeConfig',
    //         apply: 'build',
    //         enforce: 'post',
    //         config(config) {
    //             return defineConfig(config, {
    //                 publicDir: 'static', // Required
    //             });
    //         },
    //     },
    // ],
    // build: { assetsInlineLimit: 0 }, // optional
	// resolve: {
	// 	alias: {
	// 		'~': resolve(__dirname, 'src'), // optional
	// 	},
	// },

    // build: {
    //     // outDir: 'dist',
    //     rollupOptions: {
    //         input: {
    //             popup: resolve(__dirname, 'src/popup.html'),
    //             background: resolve(__dirname, 'src/background.js'),
    //             content: resolve(__dirname, 'src/content.js')
    //             // popup: 'src/popup.svelte',
    //             // background: 'src/background.js',
    //             // content: 'src/content.js'

    //         },
    //     }
    // }

});
