/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand
        primary: 'oklch(58.5% 0.233 277.117)',
        'primary-dark': 'oklch(35.146% 0.21683 277.426)',

        // Primary button
        'btn-primary': 'oklch(58.5% 0.233 277.117)',
        'btn-primary-hover': 'oklch(51.1% 0.262 276.966)',
        'btn-primary-active': 'oklch(25.5% 0.262 276.966)',
        'btn-primary-dark': 'oklch(41.1% 0.262 276.966)',

        // Secondary button
        'btn-secondary': '#5A6F87',
        'btn-secondary-hover': '#4B6278',
        'btn-secondary-active': '#1f2937',
        'btn-secondary-dark': '#374151',

        // Success
        success: '#22c55e',
        'success-hover': '#16a34a',
        'success-active': '#15803d',

        // Warning
        warning: '#f59e0b',
        'warning-hover': '#d97706',
        'warning-active': '#b45309',

        // Error
        error: '#ef4444',
        'error-hover': '#dc2626',
        'error-active': '#b91c1c',
        alert: '#ef4444',

        // Info
        info: '#2563eb',
        'info-hover': '#081D5A',
        'info-active': '#1e40af',
        'info-dark': '#79A4F6',
        'info-hover-dark': '#D1E3FC',

        // Text & greyscale
        textPrimary: '#1e293b',
        darkPrimary: '#334155',
        extraDarkPrimary: '#0f172a',
        lightPrimary: '#e0e7ff',
        grayDark: '#334155',

        // Form inputs
        'input-border': '#d1d5db',
        'input-focus': '#2563eb',
        'input-error': '#ef4444',
        'input-label': '#374151',
        'input-label-error': '#dc2626',
        'input-helper': '#6b7280',
      },
    },
  },
  plugins: [],
};
