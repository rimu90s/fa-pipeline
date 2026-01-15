/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./dev/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--fg)",
        "brand-bg": "var(--bg)",
        card: "var(--card)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(17,20,57,0.10)",
      },
    },
  },
  plugins: [],
};
