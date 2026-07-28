/**
 * Paleta oficial ConectaObra 2.0 — ver CLAUDE.md §6 e
 * docs/prd/06_Wireframes_ConectaObra.html (:root do wireframe é a fonte original).
 */
export const colors = {
  laranja: "#F26A21",
  laranjaEscuro: "#C94F0E",
  grafite: "#1E2A38",
  azulPlanta: "#1F5FA8",
  azulClaro: "#E8F1FA",
  concreto: "#EDEAE4",
  areia: "#FAF7F1",
  verdeOk: "#2E8B57",
  amareloAlerta: "#F2B705",
  vermelho: "#C0392B",
  branco: "#FFFFFF",
} as const;

export type ColorToken = keyof typeof colors;
