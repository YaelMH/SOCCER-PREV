/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        "primary-dark": "#1D4ED8",
        accent: "#22C55E",
        warning: "#FACC15",
        danger: "#DC2626",
        "app-bg": "#0F172A",
        "app-card": "#020617",
        "app-border": "#1E293B",
        "text-main": "#F9FAFB",
        "text-muted": "#9CA3AF"
      }
    },
  },
  plugins: [],
};
