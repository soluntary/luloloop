import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Ludoloop custom colors
        ludoloop: {
          teal: "#33c7c0",
          orange: "#fbbf1e",
          pink: "#f95581",
        },
        teal: {
          400: "#33c7c0",
          500: "#2db5ae",
          600: "#26a39c",
        },
        orange: {
          400: "#fbbf1e",
          500: "#e6ab1a",
          600: "#d19817",
        },
        pink: {
          400: "#f95581",
          500: "#f73d6f",
          600: "#f5255d",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        wiggle: {
          "0%, 7%": {
            transform: "rotate(0deg)",
          },
          "15%": {
            transform: "rotate(-15deg)",
          },
          "20%": {
            transform: "rotate(10deg)",
          },
          "25%": {
            transform: "rotate(-10deg)",
          },
          "30%": {
            transform: "rotate(6deg)",
          },
          "35%": {
            transform: "rotate(-4deg)",
          },
          "40%, 100%": {
            transform: "rotate(0deg)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        wiggle: "wiggle 2s ease-in-out infinite",
      },
      fontFamily: {
        handwritten: ["Galindo", "sans-serif"],
        body: ["McLaren", "sans-serif"],
        galindo: ["Galindo", "sans-serif"],
        mclaren: ["McLaren", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
