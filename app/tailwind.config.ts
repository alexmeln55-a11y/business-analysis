import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas:       '#0B0908',
        panel:        '#1A1613',
        'panel-raised': '#221C18',
        'text-primary':   '#F4EDE3',
        'text-secondary': '#CDBEAE',
        'text-muted':     '#9B8A7A',
        'copper':         '#B57A56',
        'copper-strong':  '#D09062',
        'copper-subtle':  'rgba(181,122,86,0.12)',
        'border-default': 'rgba(244,237,227,0.08)',
        'border-active':  '#B57A56',
        'error-text':     '#D97060',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['12px', { lineHeight: '1.5' }],
        'sm':   ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.5' }],
        'md':   ['18px', { lineHeight: '1.5' }],
        'lg':   ['22px', { lineHeight: '1.35' }],
        'xl':   ['28px', { lineHeight: '1.2' }],
        '2xl':  ['36px', { lineHeight: '1.2' }],
        '3xl':  ['48px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        'sm': '14px',
        'md': '18px',
        'lg': '24px',
        'xl': '32px',
      },
      spacing: {
        '1': '8px',
        '2': '12px',
        '3': '16px',
        '4': '24px',
        '5': '32px',
        '6': '48px',
        '7': '64px',
        '8': '96px',
      },
      boxShadow: {
        'soft': '0 12px 40px rgba(0,0,0,0.26)',
        'deep': '0 24px 80px rgba(0,0,0,0.42)',
      },
      maxWidth: {
        'content': '720px',
        'page':    '1100px',
      },
    },
  },
  plugins: [],
}

export default config
