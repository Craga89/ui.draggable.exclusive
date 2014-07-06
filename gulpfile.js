var gulp = require('gulp'),
	connect = require('gulp-connect'),
	markdown = require('gulp-markdown'),
	jade = require('gulp-jade'),
	rimraf = require('gulp-rimraf');

gulp.task('clean', function() {
	return gulp.src('index.html')
		.pipe(rimraf());
})

gulp.task('markdown', function() {
	return gulp.src('site/content.md')
		.pipe(markdown())
		.pipe(gulp.dest('site/'));
});

gulp.task('jade', ['clean'], function() {
	return gulp.src('site/index.jade')
		.pipe(jade({ pretty: true }))
		.pipe(gulp.dest('.'))
		.pipe(connect.reload());
});

gulp.task('connect', function() {
	connect.server({
		port: 3333,
		livereload: true
	});
});

gulp.task('site', ['connect'], function() {
	gulp.watch('site/**/*.md', ['markdown', 'jade']);
	gulp.watch('site/**/*.jade', ['jade']);
	gulp.watch('site/**/*.css').on('change', connect.reload);
	gulp.watch('site/**/*.js').on('change', connect.reload);
});