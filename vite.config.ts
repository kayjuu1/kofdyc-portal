import {defineConfig, type Plugin} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import {tanstackStart} from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {cloudflare} from '@cloudflare/vite-plugin'

// Stub cloudflare:workers for the client environment during dev.
// The Cloudflare Vite plugin only resolves it in the SSR environment,
// so the client pre-transform fails without this stub.
function cloudflareWorkersStub(): Plugin {
    return {
        name: 'cloudflare-workers-client-stub',
        resolveId(id) {
            if (
                id === 'cloudflare:workers' &&
                this.environment?.name === 'client'
            ) {
                return '\0cloudflare-workers-stub'
            }
        },
        load(id) {
            if (id === '\0cloudflare-workers-stub') {
                return 'export const env = {}'
            }
        },
    }
}

const config = defineConfig({
    plugins: [
        cloudflareWorkersStub(),
        cloudflare({viteEnvironment: {name: 'ssr'}}),
        tsconfigPaths({projects: ['./tsconfig.json']}),
        tailwindcss(),
        tanstackStart(),
        viteReact(),
    ],
    build: {
        rollupOptions: {
            external: ['cloudflare:workers', 'cloudflare:env']
        }
    }
})

export default config
