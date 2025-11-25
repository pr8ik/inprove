/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base Palette
        primary: "#0F172A",      // Midnight slate
        secondary: "#1E293B",    // Dark slate  
        tertiary: "#334155",     // Mid slate
        surface: "#475569",      // Lighter surface (NEW)

        // Primary Accent
        accent: "#3B82F6",       // Electric blue
        accentLight: "#60A5FA", // Lighter blue for highlights (NEW)
        accentDark: "#2563EB",  // Darker blue for depth (NEW)

        // Secondary Accents (subtle, strategic use)
        purple: "#8B5CF6",       // Energetic purple (NEW)
        teal: "#14B8A6",         // Fresh teal (NEW)

        // Status Colors
        success: "#10B981",      // Emerald green
        successLight: "#34D399", // Light green for subtle glow (NEW)
        highlight: "#F97316",    // Bright orange
        highlightLight: "#FB923C", // Light orange (NEW)
        warning: "#F59E0B",      // Amber (NEW)

        // Text Hierarchy
        text: "#F8FAFC",         // Primary text
        "text-muted": "#94A3B8", // Secondary text
        "text-subtle": "#64748B", // Tertiary text (NEW)

        // Borders & Dividers
        border: "rgba(255, 255, 255, 0.05)", // Subtle borders (NEW)
        borderLight: "rgba(255, 255, 255, 0.1)", // Lighter borders (NEW)
      },
    },
  },
  plugins: [],
}
