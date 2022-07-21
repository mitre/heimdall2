const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

// Lookup constants
const fs = require('fs');
const packageJson = fs.readFileSync('./package.json');
const parsed = JSON.parse(packageJson);
const version = parsed.version || 0;
const description = parsed.description || '';
const repository = parsed.repository.url || '';
const license = parsed.license || '';
const changelog = parsed.changelog || '';
const branch = parsed.branch || '';
const issues = parsed.issues || '';

// tsconfig specification
const path = require('path');
const TSCONFIG_PATH = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'production'
    ? './tsconfig.build.json'
    : './tsconfig.json'
);

module.exports = {
  lintOnSave: 'warning',
  publicPath: '/',
  devServer: {
    // JWT_SECRET is a required secret for the backend. If it is sourced
    // then it is safe to assume the app is in server mode in development.
    //
    // PORT is not required so use the default backend port value
    // is used here if JWT_SECRET is applied but PORT is undefined
    proxy: process.env.JWT_SECRET
      ? `http://127.0.0.1:${process.env.PORT || 3000}`
      : ''
  },
  outputDir: '../../dist/frontend',
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false
      }
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    devtool: 'source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PACKAGE_VERSION': `"${version}"`,
        'process.env.DESCRIPTION': `"${description}"`,
        'process.env.REPOSITORY': `"${repository}"`,
        'process.env.LICENSE': `"${license}"`,
        'process.env.CHANGELOG': `"${changelog}"`,
        'process.env.BRANCH': `"${branch}"`,
        'process.env.ISSUES': `"${issues}"`
      }),
      new NodePolyfillPlugin({
        includeAliases: [
          'crypto',
          'path',
          'http',
          'https',
          'os',
          'zlib',
          'process',
          'Buffer',
          'stream'
        ]
      })
    ]
  },
  chainWebpack: (config) => {
    // Disable resolve symlinks to silence eslint when using `npm link`
    // (when developing inspecjs locally): https://stackoverflow.com/a/57518476/1670307
    config.resolve.symlinks(false);
    config.module
      .rule('vue')
      .use('vue-svg-inline-loader')
      .loader('vue-svg-inline-loader')
      .options();

    // specify custom tsconfig.json file
    // https://github.com/vuejs/vue-cli/issues/2421
    config.module
      .rule('ts')
      .use('ts-loader')
      .merge({options: {configFile: TSCONFIG_PATH}});
    config.plugin('fork-ts-checker').tap((args) => {
      args[0].typescript.configFile = TSCONFIG_PATH;
      return args;
    });
  }
};
