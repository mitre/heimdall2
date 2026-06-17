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

// tsconfig specification
const path = require('path');
const TSCONFIG_PATH = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'production'
    ? './tsconfig.build.json'
    : './tsconfig.json'
);

const sassSilenceDeprecations = [
  'import',
  'global-builtin',
  'slash-div',
  'legacy-js-api',
  'color-functions',
  'if-function'
];

module.exports = {
  lintOnSave: 'warning',
  publicPath: '/',
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {silenceDeprecations: sassSilenceDeprecations}
      },
      scss: {
        sassOptions: {silenceDeprecations: sassSilenceDeprecations}
      }
    }
  },
  devServer: {
    // HEIMDALL_FRONTEND_PORT sets the dev server listen port (default 8080).
    // HEIMDALL_BACKEND_PORT sets the API proxy target (default 3000).
    // HEIMDALL_SERVER_MODE enables the API proxy to the backend.
    // All set in .env.development.local — no backend secrets needed.
    // Legacy: JWT_SECRET also enables server mode for backward compatibility.
    port: parseInt(process.env.HEIMDALL_FRONTEND_PORT || '8080', 10),
    proxy: (process.env.HEIMDALL_SERVER_MODE || process.env.JWT_SECRET)
      ? `http://127.0.0.1:${process.env.HEIMDALL_BACKEND_PORT || process.env.PORT || 3000}`
      : '',
    client: {
      progress: false
    }
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
      new webpack.NormalModuleReplacementPlugin(/^node:/v, (resource) => {
        resource.request = resource.request.replace(/^node:/v, '');
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
