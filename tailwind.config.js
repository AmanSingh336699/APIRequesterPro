/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#6b7280",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

export default config;
