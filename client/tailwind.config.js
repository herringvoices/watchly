/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E91E63',
        secondary: '#9C27B0',
        'secondary-light': '#F6C0FF',
        lightest: '#FFFAFC',
        light: '#FFE5EF',
        dark: '#E5B8C8',
        darkest: '#E5739C',
        info: '#00BCD4',
        success: '#4CAF50',
        danger: '#F44336',
        'text-darkest': '#212121',
        'text-dark': '#767676',
      },
    },
  },
  plugins: [],
};
