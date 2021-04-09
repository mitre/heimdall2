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

module.exports = {
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
    config.module
      .rule('vue')
      .use('vue-svg-inline-loader')
      .loader('vue-svg-inline-loader')
      .options();
  }
};
