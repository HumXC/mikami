import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [svelte(), tailwindcss()],
    build: {
        sourcemap: true,
        minify: false,
    },
    server: {
        hmr: {
            protocol: "ws",
            host: "localhost",
            port: 5173,
        },
    },
});
