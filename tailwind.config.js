/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8ec5ff",
          400: "#59a5ff",
          500: "#0071fe",
          600: "#0059cc",
          700: "#0047a3",
          800: "#093c85",
          900: "#0d346d",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d9dce3",
          300: "#b8bec9",
          400: "#8f97a6",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#101828",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        script: ["'Dancing Script'", "cursive"],
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        card: "0 2px 4px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.06)",
        popover: "0 8px 24px rgba(16, 24, 40, 0.12)",
      },
    },
  },
  plugins: [],
}
