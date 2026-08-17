/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // EDGEHAWK midnight terminal palette
        abyss: "#05070B",
        carbon: "#0A0E14",
        steel: "#111823",
        grid: "#161F2C",
        ink: {
          primary: "#E8EDF4",
          secondary: "#8A94A6",
          muted: "#4A5568",
        },
        pulse: "#00E68C",
        signal: "#FF4D5E",
        "amber-watch": "#FFB224",
        ice: "#4DD8FF",
        quant: "#8B7CFF",
        // shadcn tokens
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        glow: "0 0 24px #00E68C33",
        "glow-lg": "0 8px 32px #00E68C14, 0 0 24px #00E68C33",
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        scanline: {
          "0%": { transform: "translateY(-8px)" },
          "100%": { transform: "translateY(1024px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "tick-up": {
          "0%": { backgroundColor: "rgba(0, 230, 140, 0.15)" },
          "100%": { backgroundColor: "rgba(0, 230, 140, 0)" },
        },
        "tick-down": {
          "0%": { backgroundColor: "rgba(255, 77, 94, 0.15)" },
          "100%": { backgroundColor: "rgba(255, 77, 94, 0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 16px #00E68C33" },
          "50%": { boxShadow: "0 0 32px #00E68C59" },
        },
        shine: {
          "0%": { transform: "translateX(-120%) skewX(-18deg)" },
          "100%": { transform: "translateX(220%) skewX(-18deg)" },
        },
        "ring-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 2px rgba(0,230,140,0.55)" },
          "50%": { boxShadow: "0 0 0 5px rgba(0,230,140,0.12)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        marquee: "marquee 45s linear infinite",
        scanline: "scanline 6s linear infinite",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
        "tick-up": "tick-up 300ms ease-out",
        "tick-down": "tick-down 300ms ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "ring-pulse": "ring-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
