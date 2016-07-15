/// <binding AfterBuild='default' Clean='clean' />
/*
This file is the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp');
var del = require('del');
var rename = require('gulp-rename');
var typescript = require('gulp-typescript');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var paths = {
    input: 'src/**/*',
    output: 'dist/',
    scripts: {
        input: 'scripts/**/*.ts',
        output: 'wwwroot/scripts/'
    },
    styles: {
        input: 'styles/**/*.{less,css}',
        output: 'dist/styles/'
    },
    svgs: {
        input: 'src/svg/*',
        output: 'dist/svg/'
    },
    images: {
        input: 'src/img/*',
        output: 'dist/img/'
    },
    static: {
        input: 'src/static/*',
        output: 'dist/'
    },
    test: {
        input: 'src/js/**/*.js',
        karma: 'test/karma.conf.js',
        spec: 'test/spec/**/*.js',
        coverage: 'test/coverage/',
        results: 'test/results/'
    },
    docs: {
        input: 'src/docs/*.{html,md,markdown}',
        output: 'docs/',
        templates: 'src/docs/_templates/',
        assets: 'src/docs/assets/**'
    }
};

gulp.task('styles', function () {
  return gulp.src('./styles/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('./wwwroot/styles'));
});

gulp.task('clean', function () {
    return del(['wwwroot/js/**/*']);
});

gulp.task('scripts', ['clean'], function () {

    return gulp.src([paths.scripts.input, '!scripts/libs/**/*'])
        .pipe(typescript({
            noImplicitAny: false,
            out: 'script.js'
        }))
        .pipe(gulp.dest(paths.scripts.output))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.scripts.output))

});

gulp.task('libs',['clean'],function(){
    return gulp.src('./scripts/libs/**/*')
               .pipe(gulp.dest('wwwroot/scripts/libs'));
});

gulp.task('watch', ['default'], function () {
    return gulp.watch([
                        paths.scripts.input,
                        paths.styles.input,
                         ], { ignoreInitial: false },['default']);
});

gulp.task('default', ['scripts','libs','styles'], function () {
  
});