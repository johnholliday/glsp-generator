const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        webview: './src/webview/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'webview'),
        filename: 'index.js'
    },
    mode: 'production',
    target: 'web',
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        fallback: {
            "fs": false,
            "path": false,
            "crypto": false,
            "buffer": false,
            "stream": false,
            "util": false,
            "assert": false,
            "process": false
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        })
    ],
    externals: {
        'vscode': 'commonjs vscode'
    }
};