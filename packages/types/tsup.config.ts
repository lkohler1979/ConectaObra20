import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/auth.ts",
    "src/documents.ts",
    "src/media.ts",
    "src/profile.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
