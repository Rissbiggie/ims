/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/**/*.{js,jsx,vue,php}',
    './resources/views/**/*.php',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e40af',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
