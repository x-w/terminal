// Dependencies
var exec = require('child_process').exec;
var fs = require('fs-extra');
var less = require('less');
var mime = require('mime');
var seq = require('seq');

// Do the build.
var build = {};
seq()
	.seq(function () {
		// Read in the project version.
		fs.readFile('VERSION', 'ascii', this);
	})
	.seq(function(version) {
		// Save the version number for later.
		build.version = '' + version.trim();
		console.log('version = ' + version);

		// Copy raw JS, if required.
		/*
		fs.copyFileSync('lib/terminal.js', 'dist/terminal-' + build.version + '.js');
		*/

		// Minify JS.
		var minimizeCommand = 'java -jar build/closure/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js lib/terminal.js --js_output_file dist/terminal-' + build.version + '.min.js';
		console.log('minimize command : ' + minimizeCommand);
		exec(minimizeCommand, this);
		console.log('JS minimized');

		// Alternatively, use jsmin. It doesn't compress as much as the closure compiler.
		/*
		var jsmin = require('jsmin').jsmin;
		var minified = jsmin(css, 3);
		*/
	})
	.par(function () {
		// Read in the less stylesheet.
		console.log("terminal.less to load");
		fs.readFile('lib/terminal.less', 'ascii', this);
		console.log("terminal.less loaded");
	})
	.par(function () {
		// Read in 'interlace.png'.
		console.log("interlace.png to load");
		fs.readFile('lib/interlace.png', this);
		console.log("interlace.png loaded");
	})
	.par(function () {
		// Read in 'external.png'.
		console.log("external.png to load");
		fs.readFile('lib/external.png', this);
		console.log("external.png loaded");
	})
	.seq(function(styles, interlacepng, externalpng) {
		// Convert to string.
		styles = '' + styles;

		// Embed interlace.png
		var interlace = 'url("data:' + mime.lookup('lib/interlace.png') + ';base64,' + new Buffer(interlacepng).toString('base64') + '")';
		styles = styles.replace('dataurl("interlace.png")', interlace);
		console.log("interlace.png replaced");

		// Embed external.png
		var external = 'url("data:' + mime.lookup('lib/external.png') + ';base64,' + new Buffer(externalpng).toString('base64') + '")';
		styles = styles.replace('dataurl("external.png")', external);
		console.log("external.png replaced");

		// Minify the stylesheet.
		less.render(styles, {compress: true}, this);

		console.log("CSS compressed");
	})
	.seq(function(css) {
		// Write out the minified CSS.
		var cssFilename = 'dist/terminal-' + build.version + '.min.css';
		fs.writeFile(cssFilename, css);
		console.log(cssFilename + "saved");
	});
