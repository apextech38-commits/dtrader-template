const path = require('path');
const { ALIASES, IS_RELEASE, MINIMIZERS, plugins, rules } = require('./constants');
const { openChromeBasedOnPlatform } = require('./helpers');

module.exports = function (env) {
    const base = '/';
    const sub_path = env && env.open && env.open !== true ? env.open : '';

    return {
        context: path.resolve(__dirname, '../src'),
        devServer: {
            static: {
                publicPath: base,
                watch: true,
            },
            open: {
                app: {
                    name: openChromeBasedOnPlatform(process.platform),
                },
                target: sub_path,
            },
            host: 'localhost',
            server: 'https',
            port: 8443,
            historyApiFallback: true,
            hot: false,
            client: {
                overlay: false,
            },
        },
        devtool: IS_RELEASE ? 'source-map' : 'eval-cheap-module-source-map',
        entry: './index.tsx',
        mode: IS_RELEASE ? 'production' : 'development',
        module: {
            // We pass the loader path to your existing rules function
            rules: rules(path.resolve(__dirname, '../../shared/src/styles/constants/colors.scss')),
        },
        resolve: {
            alias: ALIASES,
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            symlinks: true,
        },
        optimization: {
            minimize: IS_RELEASE,
            minimizer: MINIMIZERS,
            splitChunks: {
                chunks: 'all',
                minSize: 75000,
                minSizeReduction: 75000,
                minChunks: 1,
                maxSize: 1000000,
                maxAsyncRequests: 30,
                maxInitialRequests: 30,
                automaticNameDelimiter: '~',
                enforceSizeThreshold: 1000000,
                cacheGroups: {
                    vendorStyles: {
                        test: module => {
                            return (
                                module.type === 'css/mini-extract' && /[\\/]node_modules[\\/]/.test(module.identifier())
                            );
                        },
                        name: 'vendor',
                        chunks: 'all',
                        priority: 30,
                        enforce: true,
                    },
                    framework: {
                        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|mobx|mobx-react-lite|mobx-utils)[\\/]/,
                        name: 'framework-vendor',
                        priority: 40,
                        enforce: true,
                        reuseExistingChunk: true,
                    },
                    deriv: {
                        test: /[\\/]node_modules[\\/](@deriv-com[\\/]ui|@deriv[\\/]components|@deriv[\\/]shared|@deriv-com[\\/]translations)[\\/]/,
                        name: 'deriv-vendor',
                        priority: 35,
                        enforce: true,
                        reuseExistingChunk: true,
                    },
                    datetime: {
                        test: /[\\/]node_modules[\\/](moment|dayjs)[\\/]/,
                        name: 'datetime-vendor',
                        priority: 28,
                        enforce: true,
                        reuseExistingChunk: true,
                    },
                    default: {
                        minChunks: 2,
                        minSize: 75000,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                    defaultVendors: {
                        idHint: 'vendors',
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        reuseExistingChunk: true,
                    },
                },
            },
        },
        output: {
            filename: 'js/core.[name].[contenthash].js',
            publicPath: base,
            path: path.resolve(__dirname, '../dist'),
        },
        plugins: plugins({
            base,
            is_test_env: false,
            env,
        }),
        snapshot: {
            managedPaths: [],
        },
        stats: {
            colors: true,
        },
    };
};
