const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

// lookup constants
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
const NODE_PROTOCOL_PREFIX = /^node:/v;

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
    // API_PROXY_TARGET (apps/frontend/.env.development) points this dev
    // server's proxy at the backend — server-mode development. Unset/empty
    // (e.g. via .env.development.local) means no proxy: GET /server fails and
    // the app runs as heimdall-lite standalone (src/store/server.ts catches
    // that path). The frontend owns this setting; it deliberately reads
    // NOTHING from apps/backend/.env — reusing the backend's PORT here (as
    // both the bind port and the proxy target) broke dev on 2026-08-10.
    proxy: process.env.API_PROXY_TARGET || ''
  },
  outputDir: '../../dist/frontend',
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        http2: false
      }
    },
    module: {
      rules: [
        {
          test: /\.m?js$/v,
          exclude: /(?:bower_components|node_modules)/v,
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
      new webpack.NormalModuleReplacementPlugin(NODE_PROTOCOL_PREFIX, (resource) => {
        resource.request = resource.request.replace(NODE_PROTOCOL_PREFIX, '');
      }),
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
        additionalAliases: ['process']
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
