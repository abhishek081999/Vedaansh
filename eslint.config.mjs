import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'public/sw.js',
      'next-env.d.ts',
      'scratch/**',
      'ephe/**',
      'remotion/**',
    ],
  },
  ...nextCoreWebVitals,
  {
    // Bypass react version auto-detection (uses removed context.getFilename() on ESLint 10)
    settings: {
      react: { version: '19' },
    },
  },
  {
    rules: {
      // New in eslint-plugin-react-hooks v7 — many existing client effects use this pattern
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/error-boundaries': 'off',
    },
  },
  {
    // next/og ImageResponse requires raw <img> (next/image is not supported there)
    files: ['**/opengraph-image.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]

export default eslintConfig
