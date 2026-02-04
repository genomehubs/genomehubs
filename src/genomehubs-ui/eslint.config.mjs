import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import storybook from "eslint-plugin-storybook";

export default [
  {
    ignores: ["node_modules", "dist", "build", ".storybook"],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        React: "readonly",
        Fragment: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        structuredClone: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        Blob: "readonly",
        MouseEvent: "readonly",
        alert: "readonly",
        btoa: "readonly",
        // Node globals
        process: "readonly",
        global: "readonly",
        // Webpack/build-time globals
        __webpack_hash__: "readonly",
        __webpack_public_path__: "writable",
        // App-specific globals
        BASENAME: "readonly",
        PAGES_URL: "readonly",
        COMMIT_HASH: "readonly",
        COOKIE_BANNER: "readonly",
        DEFAULT_INDEX: "readonly",
        TREE_THRESHOLD: "readonly",
        CITATION_URL: "readonly",
        SITENAME: "readonly",
        ARCHIVE: "readonly",
        SUGGESTED_TERM: "readonly",
        MAP_THRESHOLD: "readonly",
        TAXONOMY: "readonly",
        API_URL: "readonly",
        // Intentionally unused in some files
        open: "readonly",
        require: "readonly",
        // Selectors/state - these are module-level assignments
        taxonomy: "readonly",
        cancelNodeRequest: "readonly",
        setSavedOptions: "readonly",
        resetPages: "readonly",
        pageId: "readonly",
        qs: "readonly",
        str: "readonly",
        // Variables that should be declared locally but aren't
        length: "writable",
        basename: "writable",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      "no-undef": "error",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "warn",
      "react/jsx-no-target-blank": "warn",
      "react/jsx-key": "warn",
      "react/jsx-no-undef": "error",
      "react/no-unescaped-entities": "warn",
      "react/no-children-prop": "warn",
      "react/no-unknown-property": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prettier/prettier": "warn",
      "no-empty": "warn",
      "no-prototype-builtins": "warn",
      "no-useless-escape": "warn",
      "no-dupe-keys": "warn",
      "no-empty-pattern": "warn",
      "no-constant-binary-expression": "warn",
      "no-constant-condition": "warn",
      "no-global-assign": "error",
      // Disable rules that require plugins we don't have
      "react-hooks/exhaustive-deps": "off",
      // Allow eslint-disable comments for any rule
      "no-unrecognized-rule": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: [".storybook/**/*.{js,jsx}", "src/**/*.stories.{js,jsx}"],
    plugins: {
      storybook,
    },
    rules: {
      ...storybook.configs.recommended.rules,
    },
  },
];
