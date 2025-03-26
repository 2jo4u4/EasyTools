import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import babel from "@rollup/plugin-babel";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);
const packageFile = path.resolve(currentFile, "../package.json");
const json = JSON.parse(fs.readFileSync(packageFile, "utf-8"));

/** @typedef {import('rollup').RollupOptions} RollupOptions */
/** @type {RollupOptions | RollupOptions[]} */
export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: json.main,
        format: "cjs",
        sourcemap: false,
      },
      {
        file: json.module,
        format: "esm",
        sourcemap: false,
      },
      {
        file: json.umd,
        format: "umd",
        sourcemap: false,
        name: json.name,
        globals: {
          rxjs: "rxjs",
        },
      },
      {
        file: "dist/umd/index.min.js",
        format: "umd",
        plugins: [terser()],
        name: json.name,
        globals: {
          rxjs: "rxjs",
        },
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      babel({
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        babelHelpers: "bundled",
        presets: ["@babel/preset-react"],
      }),
    ],
    external: ["rxjs"],
  },
  {
    input: "src/index.ts",
    output: {
      file: json.types,
      format: "es",
    },
    plugins: [dts()],
  },
];
