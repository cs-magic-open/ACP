const path = require("path");

/** @type {import('webpack').Configuration[]} */
module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const isDevelopment = !isProduction;

  return [
    {
      name: "extension",
      target: "node",
      mode: "development",
      entry: "./src/extension.ts",
      output: {
        path: path.resolve(__dirname, "out"),
        filename: "extension.js",
        libraryTarget: "commonjs2",
      },
      externals: {
        vscode: "commonjs vscode",
      },
      resolve: {
        extensions: [".ts", ".js"],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: ["ts-loader"],
          },
        ],
      },
      devtool: "nosources-source-map",
    },
    {
      name: "webview",
      target: "web",
      mode: "development",
      entry: "./src/webview/app.tsx",
      output: {
        path: path.resolve(__dirname, "out", "webview"),
        filename: "app.js",
      },
      devtool: isDevelopment ? "inline-source-map" : "source-map",
      resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: ["ts-loader"],
          },
          {
            test: /\.css$/,
            use: [
              "style-loader",
              {
                loader: "css-loader",
                options: {
                  importLoaders: 1,
                },
              },
              "postcss-loader",
            ],
          },
        ],
      },
    },
  ];
};
