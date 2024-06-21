const path = require("path");

module.exports = {
    target: "node",
    entry: './index.ts',
    module: {
      rules: [
        {
            test: /\.html$/,
            use: 'html-loader',
            exclude: /node_modules/
        },
        {
            test: /\.ts?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }
      ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.html']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'lib')
    }
};