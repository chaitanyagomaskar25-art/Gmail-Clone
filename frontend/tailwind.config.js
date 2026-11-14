/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gmail: {
          bg: "#f6f8fc",
          card: "#ffffff",
          activePill: "#d3e3fd",
          compose: "#c2e7ff",
          hover: "#f2f6fc",
          text: "#1f1f1f",
          subtext: "#5f6368",
          border: "#e7e9ed",
          blue: "#0b57d0",
          hoverBlue: "#0842a0",
          red: "#b3261e",
          // Dark mode
          darkBg: "#111318",
          darkCard: "#1e1f20",
          darkActivePill: "#004a77",
          darkCompose: "#c2e7ff",
          darkHover: "#282c37",
          darkText: "#e3e3e3",
          darkSubtext: "#9aa0a6",
          darkBorder: "#2d3139",
        },
      },
      fontFamily: {
        sans: ["Roboto", "'Plus Jakarta Sans'", "sans-serif"],
      },
      boxShadow: {
        gmail: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
        compose: "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
        search: "0 1px 1px 0 rgba(65,69,73,0.3), 0 1px 3px 1px rgba(65,69,73,0.15)",
        searchFocus: "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
        popup: "0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};
