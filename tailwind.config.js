/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#00C8FF',
          dark: '#009FD4',
          light: '#4DD6FF',
          50: '#E6F9FF',
          100: '#B3ECFF',
          200: '#80DFFF',
          300: '#4DD6FF',
          400: '#1ACDFF',
          500: '#00C8FF',
          600: '#009FD4',
          700: '#0077A6',
          800: '#004F73',
          900: '#002840',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E31E24',
          dark: '#B81820',
          light: '#FF4D52',
          50: '#FEE7E8',
          100: '#FCC5C7',
          200: '#FA9DA1',
          300: '#F7747A',
          400: '#F44D52',
          500: '#E31E24',
          600: '#B81820',
          700: '#8C121A',
          800: '#610C12',
          900: '#35070A',
          foreground: '#FFFFFF',
        },
        black: '#000000',
        white: '#FFFFFF',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'logo-gradient': 'linear-gradient(135deg, #00C8FF 0%, #009FD4 100%)',
        'danger-gradient': 'linear-gradient(135deg, #E31E24 0%, #B81820 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
