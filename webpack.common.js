const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const path = require('path');

module.exports = {
    target: ['web', 'es6'],
    entry: {
        'react-vendors': {
            import: ['react', 'react-dom', 'react-jss', 'classnames', 'base16']
        },
        devtools: './src/app/devtools.ts',
        panel: './src/app/panel.tsx',
        sandbox: {
            import: './src/app/sandbox.tsx',
            dependOn: ['react-vendors', 'settings']
        },
        sandboxSettings: {
            import: './src/app/sandboxSettings.tsx',
            dependOn: ['react-vendors', 'settings']
        },
        options: {
            import: './src/app/options.tsx',
            dependOn: ['react-vendors', 'settings']
        },
        settings: {
            import: './src/controllers/settings.ts',
            dependOn: ['react-vendors']
        }
    },

    plugins: [
        new CleanWebpackPlugin(),
        new CircularDependencyPlugin({
            // exclude detection of files based on a RegExp
            exclude: /a\.js|node_modules/,
            // include specific files based on a RegExp
            include: /dir/,
            // add errors to webpack instead of warnings
            failOnError: true,
            // allow import cycles that include an asyncronous import,
            // e.g. via import(/* webpackMode: "weak" */ './file.js')
            allowAsyncCycles: false,
            // set the current working directory for displaying module paths
            cwd: process.cwd()
        })
    ],

    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: '[name].js'
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        plugins: [new TsconfigPathsPlugin()]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader'
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
};
