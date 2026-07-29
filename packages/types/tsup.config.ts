import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/ai-calc.ts",
    "src/auth.ts",
    "src/catalog.ts",
    "src/contracts.ts",
    "src/documents.ts",
    "src/geo.ts",
    "src/legal.ts",
    "src/media.ts",
    "src/portfolio.ts",
    "src/profile.ts",
    "src/rfq.ts",
    "src/rfq-proposals.ts",
    "src/search.ts",
    "src/works.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
