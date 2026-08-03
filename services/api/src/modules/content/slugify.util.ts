const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/** "Cimento em alta: veja os preços" -> "cimento-em-alta-veja-os-precos". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
