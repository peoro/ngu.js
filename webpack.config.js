
const path = require('path');

module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'ngu.js',
		path: path.resolve(__dirname, 'dist')
	}
};
