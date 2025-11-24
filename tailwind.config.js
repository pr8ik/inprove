/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // True Black
        secondary: "#121212", // Dark Gray Surface
        tertiary: "#1E1E1E", // Lighter Gray for cards
        accent: "#3B82F6", // Electric Blue
        highlight: "#F97316", // Bright Orange
        success: "#10B981", // Emerald Green
        text: "#FFFFFF",
        "text-muted": "#A3A3A3",
      },
    },
  },
  plugins: [],
}
