module.exports = {
  publicPath: "/ccu-gcau-1",
  outputDir: "docs",
  transpileDependencies: ["@labzdjee/agc-util", "@labzdjee/reac-ter"],
  productionSourceMap: process.env.NODE_ENV != 'production',
};
