import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

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
  ...compat.extends('next/core-web-vitals'),
  {
    // next/og ImageResponse requires raw <img> (next/image is not supported there)
    files: ['**/opengraph-image.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]

export default eslintConfig
