
const path = require('path');

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
};

module.exports = (env, argv)=>{
	if( argv.mode === 'development' ) {}
	if( argv.mode === 'production' ) {}
	return config;
};
