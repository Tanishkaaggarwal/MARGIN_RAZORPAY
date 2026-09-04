/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0F19',
          card: '#111827',
          cardHover: '#172136',
          border: '#1E293B',
          accent: '#10B981',      // Safety green
          warning: '#F59E0B',     // Buffer warning amber
          danger: '#EF4444',      // Critical red
          brand: '#3B82F6',       // Razorpay-adjacent blue
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
