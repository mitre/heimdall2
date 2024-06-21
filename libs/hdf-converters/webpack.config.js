const path = require('path');

module.exports = {
    target: 'node',
    entry: './index.ts',
    module: {
      rules: [
        {
            test: /\.ts$/,
            use: [
                {
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig.build.json'
                    }
                }
            ],
            exclude: /node_modules/
        },
        {
            test: /\.(html|css)$/,
            type: 'asset/source',
            exclude: /node_modules/,
        }
      ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.html', '.css'] // might need .html to generate the file
        //extensions: ['.html'] // might need .html to generate the file
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'lib')
    }
};