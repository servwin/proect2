let preprocessor = 'scss'; 
const { src, dest, parallel, series, watch } = require('gulp');
const fs = require('fs');
const fileinclude = require('gulp-file-include');
const sass = require("gulp-sass")(require("sass"));
const scss = require("gulp-sass")(require("sass"));
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const less = require('gulp-less');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const svgSprite = require('gulp-svg-sprite');
const uglify = require('gulp-uglify-es');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const del = require('del');
const browserSync = require("browser-sync").create();

const srcPath = 'src/';
const distPath = 'dist/';

const path = {
    build: {
        html:   distPath,
        resources:   distPath,
        js:     distPath + "assets/js/",
        css:    distPath + "assets/css/",
        images: distPath + "assets/images/",
        svg: distPath + "assets/images/",
        fonts:  distPath + "assets/fonts/"
    },
    src: {
        html:   srcPath + "*.html",
        js:     srcPath + "assets/js/scripts.js",
        css:    srcPath + 'assets/' + preprocessor + '/styles.' + preprocessor + '',
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**.ttf",
        svg:  srcPath + "assets/images/svg/**.svg",
        resources:  srcPath + "assets/resources/**/*.*",
        
    },
    watch: {
        html:   srcPath + "**/*.html",
        js:     srcPath + "assets/js/**/*.js",
        css:    srcPath + 'assets/**/' + preprocessor + '/**/*',
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**.ttf",
        resources:  srcPath + "assets/resources/**/*.*",
        svg:  srcPath + "assets/images/svg/**.svg"
       
    },
    clean: "./" + distPath
}

let isProd = false; 

function html() {
  return src(path.src.html)
  .pipe(fileinclude({prefix: '@@'}))
  .pipe(dest(path.build.html))
  .pipe(browserSync.stream());
}

function css() {
  return src(path.src.css)
  .pipe(eval(preprocessor)())
  .pipe(gulpif(isProd,sourcemaps.init()))
  .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) 
	.pipe(gulpif(isProd,cleancss( { level: { 2: { specialComments: 0 }}})))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulpif(isProd,sourcemaps.write('.')))
  .pipe(dest(path.build.css))
  .pipe(browserSync.stream());
}

function js() {
  return src(path.src.js)
  .pipe(webpackStream({
    mode: isProd ? 'production' : 'development',
    output: {
      filename: 'scripts.js',
    },
    module: {
      rules: [{
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }]
    },
  }))
  .pipe(gulpif(!isProd,sourcemaps.init()))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulpif(!isProd,sourcemaps.write('.')))
  .pipe(dest(path.build.js))
  .pipe(browserSync.stream());
}

function images() {
  return src(path.src.images)
  .pipe(imagemin({
    progressive: true,
    svgoPlugins: [{ removeViewBox: false }],
    interlaced: true,
    optimizationLevel: 3 
  }))
  .pipe(dest(path.build.images))
  .pipe(browserSync.stream());
}

function svgSprites() {
  return src(path.src.svg)
  .pipe(svgSprite({
    mode: {
      stack: {
        sprite: "../sprite.svg"
      }
    }
  }))
  .pipe(dest(path.build.svg))
}

function fonts() {
  src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts))
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts))
    .pipe(browserSync.stream());
}


function resources() {
  return src(path.src.resources)
  .pipe(dest(path.build.resources))
  .pipe(browserSync.stream());
}



function clean() {
  return del(path.clean)
}
function  toProd  (done) {
  isProd = true;
  done();
};

function startWatch() {
  browserSync.init({
    server: {
        baseDir: "./" + distPath
    },
    notify:false,
    online: false
});
  watch(path.watch.html, html);
  watch(path.watch.css, css);
  watch(path.watch.js, js);
  watch(path.watch.images, images);
  watch(path.watch.fonts, fonts);
  watch(path.watch.svg, svgSprites);
}

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.svgSprites = svgSprites;
exports.resources = resources;
exports.clean = clean;
exports.default = series(clean,html,css,js,images,fonts,svgSprites,resources,parallel(startWatch));
exports.build = series(toProd,clean,html,css,js,images,fonts,svgSprites,resources);