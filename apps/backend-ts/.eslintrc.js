module.exports = {
  extends: ["@stamper/eslint-config"],
  parserOptions: { tsconfigRootDir: __dirname, project: ["./tsconfig.json"] },
  ignorePatterns: ["*.js"]
};
