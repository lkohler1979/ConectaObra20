import type { Config } from "tailwindcss";
import { colors, fontFamily, fontSize, radius, shadow } from "./src/tokens";

/**
 * Preset Tailwind do Design System ConectaObra 2.0.
 * Consumido pelos apps via `presets: [require("@conectaobra/ui/tailwind.preset")]`.
 */
const preset: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        laranja: { DEFAULT: colors.laranja, escuro: colors.laranjaEscuro },
        grafite: colors.grafite,
        "azul-planta": { DEFAULT: colors.azulPlanta, claro: colors.azulClaro },
        concreto: colors.concreto,
        areia: colors.areia,
        "verde-ok": colors.verdeOk,
        "amarelo-alerta": colors.amareloAlerta,
        vermelho: colors.vermelho,
      },
      fontFamily: {
        sans: fontFamily.sans,
      },
      fontSize,
      borderRadius: {
        sm: radius.sm,
        DEFAULT: radius.base,
        pill: radius.pill,
      },
      boxShadow: {
        DEFAULT: shadow.base,
      },
    },
  },
  plugins: [],
};

export default preset;
