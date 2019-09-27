let HtmlWebpackPlugin = require("html-webpack-plugin");
let HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  configureWebpack: {
    plugins: [
      new HtmlWebpackPlugin({
        template: "public/index.html",
        inlineSource: ".(js|css)$"
      }),
      new HtmlWebpackInlineSourcePlugin()
    ]
  },
  css: {
    loaderOptions: {
      sass: {
        data: `@import "~@/sass/main.scss"`
      }
    }
  },
  chainWebpack: config => {
    ["vue-modules", "vue", "normal-modules", "normal"].forEach(match => {
      config.module
        .rule("scss")
        .oneOf(match)
        .use("sass-loader")
        .tap(opt =>
          Object.assign(opt, { data: `@import '~@/sass/main.scss';` })
        );
    });
  }
};
