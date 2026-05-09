/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: "#ffe17c",
        charcoal: "#171e19",
        sage: "#b7c6c2",
      },
      fontFamily: {
        sans: ['"Satoshi"', 'sans-serif'],
        heading: ['"Cabinet Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        'brutal-lg': "6px 6px 0px 0px #000000",
      }
    },
  },
  plugins: [],
}
