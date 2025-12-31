import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Protocolo Lyra - Dark Mode con acentos
        background: "hsl(222, 47%, 11%)", // Azul muy oscuro
        foreground: "hsl(213, 31%, 91%)", // Casi blanco
        card: {
          DEFAULT: "hsl(224, 71%, 4%)", // Azul casi negro para tarjetas
          foreground: "hsl(213, 31%, 91%)",
        },
        primary: {
          DEFAULT: "hsl(217, 91%, 60%)", // Azul eléctrico
          foreground: "hsl(222, 47%, 11%)",
        },
        secondary: {
          DEFAULT: "hsl(158, 64%, 52%)", // Verde esmeralda
          foreground: "hsl(222, 47%, 11%)",
        },
        muted: {
          DEFAULT: "hsl(217, 33%, 17%)",
          foreground: "hsl(215, 20%, 65%)",
        },
        accent: {
          DEFAULT: "hsl(217, 91%, 60%)",
          foreground: "hsl(222, 47%, 11%)",
        },
        border: "hsl(217, 33%, 17%)",
        input: "hsl(217, 33%, 17%)",
        ring: "hsl(217, 91%, 60%)",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

