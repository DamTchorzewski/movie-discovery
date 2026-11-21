import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["dist", ".scratch", "node_modules", "playwright-report", "test-results"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.tsx"],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
