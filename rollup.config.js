import terser from "@rollup/plugin-terser";
import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import glob from "glob";
import commonjs from "@rollup/plugin-commonjs";

const scriptPattern = path.resolve(__dirname, "_js/**/!(_)*.js");

const inputs = glob.sync(scriptPattern).reduce((files, input) => {
  const parts = input.split("/");
  const fileKey = parts[parts.length - 1];
  return { [fileKey]: input, ...files };
}, {});

const outputs = Object.keys(inputs).reduce((files, file) => {
  const inputPath = inputs[file];
  const parts = inputPath.split("/");
  const pathIndex = parts.indexOf("_js") + 1;
  const outputPath = parts.slice(pathIndex).join("/");
  return { [file]: `assets/js/${outputPath}`, ...files };
}, {});

const bundles = Object.keys(inputs).map((key) => {
  return {
    input: inputs[key],
    output: {
      file: outputs[key],
      format: "iife",
      name: outputs[key],
      sourcemap: false,
    },
    plugins: [
      resolve(),
      babel({
        exclude: "node_modules/**",
        comments: false,
      }),
      terser(),
      commonjs(),
    ],
  };
});

export default bundles;
