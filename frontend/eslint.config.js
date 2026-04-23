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
  globalIgnores(["dist/**", "node_modules/**", "coverage/**", "api/**"]),
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
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-globals": [
        "error",
        { name: "confirm", message: "Use a modal, not the native confirm() dialog" },
        { name: "alert", message: "Use page or modal UI, not window.alert" },
        { name: "prompt", message: "Use a form field, not window.prompt" },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "confirm",
          message: "Use a modal, not the native confirm() dialog",
        },
        { object: "window", property: "alert", message: "Use page or modal UI, not window.alert" },
        { object: "window", property: "prompt", message: "Use a form, not window.prompt" },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: { ...globals.vitest, ...globals.browser },
    },
  },
  eslintConfigPrettier,
);
