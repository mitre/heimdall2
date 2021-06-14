var webpack = require('webpack');

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

// This grabs the js/css to allow for HTML export
fs.copyFile(
  require.resolve('bootstrap/dist/css/bootstrap.min.css'),
  'public/static/export/style.css',
  (err) => {
    if (err) {
      throw err;
    }
  }
);
fs.copyFile(
  require.resolve('bootstrap/dist/js/bootstrap.min.js'),
  'public/static/export/bootstrap.js',
  (err) => {
    if (err) {
      throw err;
    }
  }
);
fs.copyFile(
  require.resolve('jquery/dist/jquery.min.js'),
  'public/static/export/jquery.js',
  (err) => {
    if (err) {
      throw err;
    }
  }
);

module.exports = {
  lintOnSave: 'warning',
  publicPath: '/',
  devServer: {
    // JWT_SECRET is a required secret for the backend. If it is sourced
    // then it is safe to assume the app is in server mode in development.
    // PORT is not required so use the default backend port value
    // is used here if JWT_SECRET is applied but PORT is undefined
    proxy: process.env.JWT_SECRET
      ? `http://127.0.0.1:${process.env.PORT || 3000}`
      : ''
  },
  outputDir: '../../dist/frontend',
  configureWebpack: {
    devtool: 'source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          PACKAGE_VERSION: '"' + version + '"',
          DESCRIPTION: '"' + description + '"',
          REPOSITORY: '"' + repository + '"',
          LICENSE: '"' + license + '"',
          CHANGELOG: '"' + changelog + '"',
          BRANCH: '"' + branch + '"',
          ISSUES: '"' + issues + '"'
        }
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
  }
};
