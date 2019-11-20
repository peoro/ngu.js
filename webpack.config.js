
const path = require('path');
const webpack = require('webpack');

const config = {
	entry: {
		app: './src/index.js',
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'ngu.js',
	},
	devServer: {
		port: 8042,
		contentBase: path.resolve(__dirname, 'dist'),
	},
	plugins: [],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						plugins: ['@babel/plugin-transform-strict-mode']
					}
				}
			},
			{
				test: /\.scss$/,
				use: [
					// "style-loader", // creates style nodes from JS strings
					"to-string-loader",
					"css-loader", // translates CSS into CommonJS
					"sass-loader" // compiles Sass to CSS, using Node Sass by default
				]
			},
		]
	},
};

module.exports = (env, argv)=>{
	config.plugins.push( new webpack.DefinePlugin({
		'process.env': {
			PROD: JSON.stringify( argv.mode === 'production' ),
			DEV: JSON.stringify( argv.mode === 'development' ),
			WEBPACK: JSON.stringify(true),
		}
	}) );

	if( argv.mode === 'development' ) {}
	if( argv.mode === 'production' ) {}

	return config;
};
