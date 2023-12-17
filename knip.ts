import type { KnipConfig } from "knip";

export default {
  ignore: [".eslintrc.cjs", "**/*.config.ts", "**/*.d.ts", "**/fixtures"],
  ignoreDependencies: [
    "eslint-config-with-tsconfig",
    "eslint-plugin-filenames-simple",
    "eslint-plugin-jsdoc",
    "swc3",
    "@eslint-react/types",
  ],
  ignoreWorkspaces: [
    "examples/*",
  ],
  workspaces: {
    ".": {
      entry: ["scripts/*.ts", "**/*.config.ts"],
      project: ["scripts/**/*.ts"],
    },
    "examples/*": {
      entry: "src/main.ts",
      project: ["src/**/*.ts", "src/**/*.tsx"],
    },
    "packages/*": {
      entry: "src/index.ts",
      project: ["src/**/*.ts"],
    },
  },
} satisfies KnipConfig;
