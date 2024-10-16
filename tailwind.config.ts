// tailwind.config.ts

import { nextui } from '@nextui-org/theme';
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Enable dark mode via a CSS class ('dark')

  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Include all your pages
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Include all your components
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Include any app directory files
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}', // Include NextUI components
  ],

  theme: {
    extend: {
      colors: {
        // Surface colors for light and dark themes
        surface: {
          // Light Theme Colors
          100: '#ffffff', // Lightest surface color
          200: '#f0f0f0', // Slightly darker surface
          300: '#d0d0d0', // Even darker surface
          // Dark Theme Colors (used with 'dark:' prefix)
          700: '#2e2e2e',
          800: '#121212',
          900: '#000000',
        },

        // Text colors
        'surface-text': {
          DEFAULT: '#000000', // Text color for light theme
          dark: '#e8eaed', // Text color for dark theme
        },

        // Primary color palette
        primary: {
          100: '#03a9f4',
          200: '#4ab2f5',
          300: '#6abcf7',
          400: '#84c5f8',
          500: '#9bcefa',
          600: '#b1d8fb',
          DEFAULT: '#03a9f4', // Default primary color
          foreground: '#ffffff', // Text color on primary backgrounds
        },

        // Secondary color palette
        secondary: {
          DEFAULT: '#f5a623',
          foreground: '#ffffff',
        },

        // Muted colors
        muted: {
          DEFAULT: '#f5f5f5',
          dark: '#1e1e1e',
          foreground: '#888888',
        },

        // Accent colors
        accent: {
          DEFAULT: '#9fa39e',
          foreground: '#ffffff',
        },

        // Destructive colors (for errors, warnings)
        destructive: {
          DEFAULT: '#e3342f',
          foreground: '#ffffff',
        },

        // Miscellaneous colors
        border: {
          DEFAULT: '#d0d0d0',
          dark: '#3f3f3f',
        },
        input: {
          DEFAULT: '#ffffff',
          dark: '#1e1e1e',
        },
        ring: {
          DEFAULT: '#f5a623',
          dark: '#f5a623',
        },
      },

      // Define border radius values
      borderRadius: {
        none: '0',
        sm: '0.125rem', // 2px
        DEFAULT: '0.25rem', // 4px
        md: '0.375rem', // 6px
        lg: '0.5rem', // 8px
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
        '3xl': '1.5rem', // 24px
        full: '9999px',
      },

      // Removed complex keyframes and animations
      // Keyframes and animations are now defined in page.css
    },
  },

  plugins: [require('tailwindcss-animate'), nextui()],
};

export default config;