// Local ESLint config so VS Code doesn't pick up a parent folder's browser/React config.
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
];
