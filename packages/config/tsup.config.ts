import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/env.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
