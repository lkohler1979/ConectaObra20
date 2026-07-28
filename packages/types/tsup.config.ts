import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/auth.ts",
    "src/documents.ts",
    "src/geo.ts",
    "src/legal.ts",
    "src/media.ts",
    "src/profile.ts",
    "src/rfq.ts",
    "src/rfq-proposals.ts",
    "src/works.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
