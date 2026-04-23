import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const reactJsx = react.configs.flat["jsx-runtime"];

export default defineConfig(
  globalIgnores(["dist/**", "node_modules/**", "coverage/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
  },
  {
    files: ["**/*.{tsx,jsx}"],
    ...reactJsx,
    settings: { react: { version: "detect" } },
  },
  {
    files: ["**/*.{tsx,jsx}"],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: { ...globals.vitest, ...globals.browser },
    },
  },
  eslintConfigPrettier,
);
