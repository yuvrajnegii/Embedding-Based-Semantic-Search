/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        // Raycast named tokens for explicit use.
        raycast: {
          canvas: "#07080a",
          surface: "#0d0d0d",
          elevated: "#101111",
          card: "#121212",
          ink: "#f4f4f6",
          body: "#cdcdcd",
          mute: "#9c9c9d",
          ash: "#6a6b6c",
          hairline: "#242728",
        },
        // primary = the white action + neutral chrome. White IS the brand CTA.
        primary: {
          50: "#141414",
          100: "#181818",
          200: "#242728",
          300: "#d3d3d4",
          400: "#cdcdcd",
          500: "#f4f4f6",
          600: "#ffffff",
          700: "#e8e8e8",
          800: "#101111",
          900: "#0d0d0d",
          950: "#07080a",
        },
        // Remap neutral scales to Raycast's inky ladder so existing classes
        // (gray-800 surfaces, gray-700 hairlines, slate text) match the system.
        gray: {
          50: "#f4f4f6",
          100: "#d3d3d4",
          200: "#9c9c9d",
          300: "#6a6b6c",
          400: "#434345",
          500: "#242728",
          600: "#242728",
          700: "#242728",
          800: "#121212",
          900: "#0d0d0d",
          950: "#07080a",
        },
        neutral: {
          50: "#f4f4f6",
          100: "#d3d3d4",
          200: "#9c9c9d",
          300: "#6a6b6c",
          400: "#434345",
          500: "#242728",
          600: "#242728",
          700: "#242728",
          800: "#121212",
          900: "#0d0d0d",
          950: "#07080a",
        },
        slate: {
          50: "#0d0d0d",
          100: "#101111",
          200: "#242728",
          300: "#6a6b6c",
          400: "#9c9c9d",
          500: "#cdcdcd",
          600: "#cdcdcd",
          700: "#d3d3d4",
          800: "#e8e8e8",
          900: "#f4f4f6",
          950: "#07080a",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
