import type { Preview } from '@storybook/react'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    a11y: { test: 'todo' },
  },
}

export default preview
