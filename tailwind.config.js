// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CoinHawk Brand Colors - New Light Theme
        hawk: {
          primary: '#272757',      // Your requested blue
          secondary: '#3a3a6b',    // Lighter blue
          accent: '#272757',       // Same blue for accent
          'accent-light': '#3a3a6b',
          'accent-dark': '#1f1f45',
        },
        
        // Status Colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        
        // Light Theme Colors
        light: {
          bg: '#fefffe',           // Your requested background
          surface: '#ffffff',      // Card backgrounds
          'surface-light': '#f8f9fa', // Hover states
          border: '#e2e8f0',       // Borders
          'text-primary': '#000000',   // Black primary text
          'text-secondary': '#374151', // Dark gray secondary text
          'text-muted': '#6b7280',     // Medium gray muted text
        },
        
        // Keep dark theme colors for potential dark mode toggle
        dark: {
          bg: '#0f172a',           // Main background
          surface: '#1e293b',      // Card backgrounds
          'surface-light': '#334155', // Hover states
          border: '#475569',       // Borders
          'text-primary': '#f8fafc',   // Primary text
          'text-secondary': '#cbd5e1', // Secondary text
          'text-muted': '#94a3b8',     // Muted text
        }
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
      },
      
      spacing: {
        '18': '4.5rem',      // 72px
        '22': '5.5rem',      // 88px
        '88': '22rem',       // 352px
        '128': '32rem',      // 512px
      },
      
      borderRadius: {
        'xl': '0.75rem',     // 12px
        '2xl': '1rem',       // 16px
        '3xl': '1.5rem',     // 24px
      },
      
      boxShadow: {
        'glow': '0 0 20px rgba(39, 39, 87, 0.15)',           // Updated for blue
        'glow-blue': '0 0 20px rgba(39, 39, 87, 0.3)',       // Blue glow
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'light-card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'light-card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glowBlue 2s ease-in-out infinite alternate',
        'glow-blue': 'glowBlue 2s ease-in-out infinite alternate',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        glowBlue: {
          '0%': { boxShadow: '0 0 5px rgba(39, 39, 87, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(39, 39, 87, 0.4)' },
        },
        // Keep original glow for backward compatibility
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(39, 39, 87, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(39, 39, 87, 0.4)' },
        },
      },
      
      backdropBlur: {
        xs: '2px',
      },
      
      // Additional utilities for the light theme
      backgroundColor: {
        'primary': '#fefffe',
        'surface': '#ffffff',
        'surface-light': '#f8f9fa',
      },
      
      textColor: {
        'primary': '#000000',
        'secondary': '#374151',
        'muted': '#6b7280',
      },
      
      borderColor: {
        'primary': '#e2e8f0',
        'secondary': '#d1d5db',
        'accent': '#272757',
      },
    },
  },
  plugins: [
    // Add any additional Tailwind plugins here
  ],
  // Changed to 'media' for system preference, or keep 'class' for manual toggle
  darkMode: 'class', // Enable dark mode (keep for potential future dark mode)
}