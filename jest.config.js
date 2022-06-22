import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export default {
  rootDir: __dirname,
  globals: {
    "ts-jest": {
      tsConfig: resolve(__dirname, "src/test", "tsconfig.json"),
    },
  },
  preset: "ts-jest",
  testMatch: ["<rootDir>/src/test/**/*.test.ts"],
  moduleNameMapper: {
    "^@lib": "<rootDir>/src/lib",
  },
};
