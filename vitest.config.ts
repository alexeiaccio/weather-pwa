import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  test: {
    environment: 'node',
    testTimeout: 30000,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['tests/browser/*.test.{ts,tsx}'],
          // Browser files share one chromium instance and mutate global state
          // (real IndexedDB, the app render). Parallel file execution races on
          // that shared instance — run serially.
          fileParallelism: false,
          globals: true,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
              {
                browser: 'chromium',
                launchOptions: {
                  args: [
                    // No camera in this app, but keep parity with the sibling
                    // repo's harness for future media/geolocation tests.
                    '--use-fake-device-for-media-stream',
                    '--use-fake-ui-for-media-stream',
                  ],
                },
              },
            ],
            // Mind One portrait: 1080 physical px @ density 400 ⇒ 432 CSS px wide.
            viewport: { width: 432, height: 1240 },
            api: { host: 'localhost' },
          },
        },
      },
    ],
  },
})
