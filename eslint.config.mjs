import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**",
      "scripts/**/*",
      ".venv-overture/**",
      "test-results/**",
      "logs/**",
      "*.js",
      "*.mjs",
      "audit.ts",
      "check-db.ts",
      "list-models.ts",
      "proxy.ts",
      "*.test.ts",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
