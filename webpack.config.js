/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = () => {
  return {
    entry: "./src/app.ts",
    module: {
      rules: [
        {
          test: /\.(js)$/,
          use: {
            loader: "babel-loader",
          },
          exclude: ["/node_modules"],
        },
        {
          test: /\.(ts)$/,
          use: {
            loader: "ts-loader",
          },
          exclude: ["/node_modules"],
        },
      ],
    },
    plugins: [new HtmlWebpackPlugin({ template: "./src/index.html" })],
    optimization: { minimize: true },
    resolve: {
      modules: ["node_modules"],
      extensions: [".ts", ".js", ".json", ".scss"],
    },
    output: { path: path.join(__dirname, "./dist"), filename: "bundle.js" },
    devtool: "source-map",
    mode: "development",
  };
};
