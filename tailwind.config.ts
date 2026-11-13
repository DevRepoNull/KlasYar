import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
        vazir: ["Vazirmatn", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
        "5xl": ["3rem", { lineHeight: "1" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1" }], // 60px
        "7xl": ["4.5rem", { lineHeight: "1" }], // 72px
        "8xl": ["6rem", { lineHeight: "1" }], // 96px
        "9xl": ["8rem", { lineHeight: "1" }], // 128px
      },
      colors: {
        border: "var(--color-border, hsl(var(--border)))",
        input: "hsl(var(--input))",
        ring: "var(--color-ring, hsl(var(--ring)))",
        background: "var(--color-bg, hsl(var(--background)))",
        foreground: "var(--color-fg, hsl(var(--foreground)))",
        primary: {
          DEFAULT: "var(--color-primary, hsl(var(--primary)))",
          foreground: "var(--color-primary-fg, hsl(var(--primary-foreground)))",
        },
        secondary: {
          DEFAULT: "var(--color-secondary, hsl(var(--secondary)))",
          foreground: "var(--color-secondary-fg, hsl(var(--secondary-foreground)))",
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
          DEFAULT: "var(--color-accent, hsl(var(--accent)))",
          foreground: "var(--color-accent-fg, hsl(var(--accent-foreground)))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "var(--color-card, hsl(var(--card)))",
          foreground: "var(--color-card-fg, hsl(var(--card-foreground)))",
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
        "aurora-1": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(40px, -60px, 0) scale(1.15)" },
          "66%": { transform: "translate3d(-30px, 30px, 0) scale(0.92)" },
        },
        "aurora-2": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(-50px, 50px, 0) scale(1.12)" },
          "66%": { transform: "translate3d(35px, -35px, 0) scale(0.94)" },
        },
        "aurora-3": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(55px, 45px, 0) scale(1.2)" },
        },
        "aurora-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "aurora-1": "aurora-1 18s ease-in-out infinite alternate",
        "aurora-2": "aurora-2 22s ease-in-out infinite alternate",
        "aurora-3": "aurora-3 26s ease-in-out infinite alternate",
        "aurora-pulse": "aurora-pulse 10s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [animate],
} satisfies Config
