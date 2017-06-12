//PROJECT CONFIG
var
        config = require('./config'),
        systems = config.systems,
        systemName = systems[config.systemName],
        projectName = config.projectName,
        themeName = (config.themeName === '' ? config.projectName : config.themeName),
        dev = config.dev,
        legacyWatch = config.legacyWatch,
        https = config.https;

//GULP REQUIRES
var
        gulp = require('gulp'),
        browserSync = require('browser-sync').create(),
        gutil = require('gulp-util'),
        ignore = require('gulp-ignore'),
        pump = require('pump'),
//        assign = require('lodash.assign'),
//        source = require('vinyl-source-stream'),
//        buffer = require('vinyl-buffer'),
//        browserify = require('browserify'),
//        watchify = require('watchify'),
        plugins = require('gulp-load-plugins')();

//SYSTEM DIRECTORY CONTROL
switch (systemName) {

    case 'workcontrol':
        var
                root = '../' + systemName + '/' + projectName + '/',
                theme = root + 'themes/' + themeName + '/',
                src = theme + '_src/',
                //DESTINATION FILES
                images = theme + 'images/',
                icons = theme + 'icons/',
                cssDest = theme,
                jsDest = theme;
        break;

    case 'activepages':
        var
                root = '../' + systemName + '/' + projectName + '/',
                theme = root,
                src = theme + '_src/',
                //DESTINATION FILES
                images = theme + 'images/',
                icons = theme + 'icons/',
                cssDest = theme,
                jsDest = theme,
                themeName = projectName;
        break;

    case 'wordpress':
        var
                root = '../' + systemName + '/' + projectName + '/wp-content/',
                theme = root + 'themes/' + themeName + '/',
                src = theme + '_src/',
                //DESTINATION FILES
                images = theme + 'build/images/',
                icons = theme + 'build/icons/',
                cssDest = theme + 'build/',
                jsDest = theme + 'build/';
        break;

}

//SOURCE FILES
var
        imgSrc = src + 'images/**/*.{jpg,jpeg,png,svg,gif}',
        imgSrcIcons = src + 'icons/**/*.{jpg,jpeg,png,svg,gif}',
        imgSrcBg = src + 'backgrounds/**/*.{jpg,jpeg,png,svg,gif}',
        cssSrc = src + 'css/**/*.css',
        jsSrc = src + 'js/**/scripts.js',
        legacyCssSrc = '../legacy-framework/_src/css/*.css',
        legacyJsSrc = '../legacy-framework/_src/js/*.js',
        legacyCssDest = '../legacy-framework/',
        legacyJsDest = '../legacy-framework/';

// ////////////////////////////////////////////////
// Browser-Sync Tasks
// ////////////////////////////////////////////////

gulp.task('browser-sync', function () {

    if (https === 1) {
        browserSync.init({
            proxy: 'https://localhost/' + systemName + '/' + projectName,
//            browser: 'C:\\Program Files\\Firefox Developer Edition\\firefox.exe',
            https: {
                key: "C:/xampp/apache/conf/ssl.key/server.key",
                cert: "C:/xampp/apache/conf/ssl.crt/server.crt"
            }
        });
    } else {
        browserSync.init({
            proxy: 'localhost/' + systemName + '/' + projectName
        });
    }

});
var reloadSwitch = 1;
gulp.task('reload', function () {
    if (reloadSwitch === 1) {
        reloadSwitch = 0;
        browserSync.reload();
        reloadTimer = setTimeout(function () {
            reloadSwitch = 1;
        }, 4000);
    }
});

// ////////////////////////////////////////////////
// Styles Tasks
// ///////////////////////////////////////////////
function css(src, dist) {
    gulp.src(src)
            .pipe(plugins.plumber())
            .pipe(plugins.concatCss('style.min.css'))
            .pipe(plugins.autoprefixer({
                browsers: ['last 3 versions'],
                cascade: false
            }))
            .pipe(dev === 1 ? gutil.noop() : plugins.csso())
            .pipe(plugins.size({showFiles: true}))
            .pipe(gulp.dest(dist))
            .pipe(browserSync.stream());
}

gulp.task('css', function () {
    css(cssSrc, cssDest);
});

if (legacyWatch === 1) {
    gulp.task('legacy-css', function () {
        css(legacyCssSrc, legacyCssDest);
    });
}

// ////////////////////////////////////////////////
// JS Tasks
// ///////////////////////////////////////////////

function js(src, dist, cb) {
    if (dev === 1) {
        var options = {
            mangle: false,
            compress: false,
            output: {beautify: true}
        };
    }
    pump([
        gulp.src(src),
        plugins.plumber(),
        plugins.rename(function (path) {
            path.basename += '.min';
        }),
        plugins.changed(dist, {hasChanged: plugins.changed.compareLastModifiedTime}),
        plugins.sourcemaps.init({loadMaps: true}),
        plugins.uglify(options),
        plugins.sourcemaps.write('./'),
        plugins.size({showFiles: true}),
        gulp.dest(dist)
    ],
            cb
            );
    browserSync.reload();
    //BROWSERIFY
//    var customOpts = {
//        entries: [src],
//        debug: true
//    };
//    var opts = assign({}, watchify.args, customOpts);
//    var b = watchify(browserify(opts));
//    return b.bundle()
//            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
//            .pipe(source(src))
//            .pipe(plugins.plumber())
//            .pipe(buffer())
//            .pipe(plugins.sourcemaps.init({loadMaps: true}))
//            .pipe(plugins.uglify(options))
//            .pipe(plugins.rename('scripts.min.js'))
//            .pipe(plugins.sourcemaps.write('./'))
//            .pipe(gulp.dest(dist))
//            .pipe(browserSync.stream());
}

gulp.task('js', function (cb) {
    js(jsSrc, jsDest, cb);
});

if (legacyWatch === 1) {
    gulp.task('legacy-js', function (cb) {
        js(legacyJsSrc, legacyJsDest, cb);
    });
}

// ////////////////////////////////////////////////
// Images Tasks
// ///////////////////////////////////////////////

gulp.task('img-compress-images', function () {
    gulp.src(imgSrc)
            .pipe(plugins.plumber())
            .pipe(plugins.changed(images, {hasChanged: changed.compareLastModifiedTime}))
            .pipe(plugins.imagemin())
            .pipe(gulp.dest(images));
    browserSync.reload();
});

gulp.task('img-compress-icons', function () {
    gulp.src(imgSrcIcons)
            .pipe(plugins.plumber())
            .pipe(plugins.changed(icons, {hasChanged: changed.compareLastModifiedTime}))
            .pipe(plugins.imagemin())
            .pipe(gulp.dest(icons));
    browserSync.reload();
});

gulp.task('img-compress', ['img-compress-images', 'img-compress-icons']);

// Background Gen
var bgSizes = [1920, 1600, 1280, 1024, 768, 480];

function imageBackgroundTask(width) {
    gulp.task('img-bg-' + width, function () {
        gulp.src(imgSrcBg)
                .pipe(plugins.plumber())
                .pipe(plugins.changed(images))
                .pipe(plugins.imageResize({width: width}))
                .pipe(plugins.imagemin())
                .pipe(plugins.rename(function (path) {
                    path.basename += ("-" + width);
                }))
                .pipe(gulp.dest(images));
    });
}

for (var i = 0; i < bgSizes.length; i++) {
    imageBackgroundTask(bgSizes[i]);
}

gulp.task('img-bg-gen', function () {
    plugins.runSequence('img-bg-' + bgSizes[0], 'img-bg-' + bgSizes[1], 'img-bg-' + bgSizes[2], 'img-bg-' + bgSizes[3], 'img-bg-' + bgSizes[4], 'img-bg-' + bgSizes[5]);
});

// ////////////////////////////////////////////////
// Zip Tasks
// ////////////////////////////////////////////////

gulp.task('root-zip', () =>
    gulp.src([
        root + '**/*',
        root + '.htaccess',
        '!' + root + '{cache,nbproject,node_modules,private}/*',
        '!' + root + '{cache,nbproject,node_modules,private}',
        '!' + src + '{icons,images,uploads,backgrounds}/*',
        '!' + src + '{icons,images,uploads,backgrounds}'
    ])
            .pipe(plugins.zip(projectName + '.zip'))
            .pipe(gulp.dest(root + '../'))
);

if (systemName !== 'activepages') {
    gulp.task('theme-zip', () =>
        gulp.src([
            theme + '/**/*', '!' + theme + '{cache,nbproject,node_modules,private}/*',
            '!' + theme + '{cache,nbproject,node_modules,private}',
            '!' + src + '{icons,images,uploads,backgrounds}/*',
            '!' + src + '{icons,images,uploads,backgrounds}'
        ])
                .pipe(plugins.zip(themeName + '.zip'))
                .pipe(gulp.dest(theme + '../'))
    );
}

// ////////////////////////////////////////////////
// Update Tasks
// ////////////////////////////////////////////////

gulp.task('wc-fullbackup', () =>
    gulp.src([
        root + '**/*',
        root + '.htaccess'
    ])
            .pipe(plugins.zip('fullbackup_' + projectName + '.zip'))
            .pipe(gulp.dest(root + '../backup_' + themeName))
);

gulp.task('wc-backup', () =>
    gulp.src([
        root + '_app/Config/*',
        root + '_app/Config.inc.php',
        root + 'admin/_siswc/**/*',
        root + 'themes/**/*',
        root + 'uploads/**/*',
        '!' + root + 'themes/wc_{conversion,default,ecommerce,imobi}/*',
        '!' + root + 'themes/wc_{conversion,default,ecommerce,imobi}'
    ])
            .pipe(gulp.dest(root + '../backup_' + themeName))
);

// ////////////////////////////////////////////////
// Watch Tasks
// ////////////////////////////////////////////////

function watch() {
    gulp.watch(jsSrc, ['js']);
    gulp.watch(cssSrc, ['css']);
    gulp.watch(root + '**/*.{php,html}', ['reload']);
    gulp.watch(src + 'images/*.{jpg,jpeg,png,svg,gif}', ['img-compress-images']);
    gulp.watch(src + 'icons/*.{jpg,jpeg,png,svg,gif}', ['img-compress-icons']);
    gulp.watch(src + 'backgrounds/*.{jpg,jpeg,png,svg,gif}', ['img-bg-gen']);
    if (legacyWatch === 1) {
        gulp.watch(legacyJsSrc, ['legacy-js']);
        gulp.watch(legacyCssSrc, ['legacy-css']);
    }
}

// ////////////////////////////////////////////////
// General Tasks
// ////////////////////////////////////////////////

gulp.task('default', ['browser-sync'], function () {
    watch();
});

gulp.task('all', ['js', 'css', 'img-compress', 'browser-sync'], function () {
    watch();
});

gulp.task('build', ['js', 'css', 'img-compress', 'generate-favicon']);

// ////////////////////////////////////////////////
// Favicon Tasks
// ////////////////////////////////////////////////

var
        faviconMasterPicture = 'images/favicon-master.png',
        themeColor = '#0052d3',
        FAVICON_DATA_FILE = theme + 'favicon/faviconData.json',
        options = {}; // File where the favicon markups are stored

gulp.task('generate-favicon', function (done) {
    plugins.realFavicon.generateFavicon({
        masterPicture: src + faviconMasterPicture,
        dest: theme + 'favicon/',
        iconsPath: '/',
        design: {
            ios: {
                pictureAspect: 'backgroundAndMargin',
                backgroundColor: '#fbfbfb',
                margin: '14%',
                assets: {
                    ios6AndPriorIcons: false,
                    ios7AndLaterIcons: false,
                    precomposedIcons: false,
                    declareOnlyDefaultIcon: true
                }
            },
            desktopBrowser: {},
            windows: {
                pictureAspect: 'noChange',
                backgroundColor: '#fbfbfb',
                onConflict: 'override',
                assets: {
                    windows80Ie10Tile: false,
                    windows10Ie11EdgeTiles: {
                        small: false,
                        medium: true,
                        big: false,
                        rectangle: false
                    }
                }
            },
            androidChrome: {
                pictureAspect: 'noChange',
                themeColor: themeColor,
                manifest: {
                    display: 'standalone',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: false,
                    lowResolutionIcons: false
                }
            },
            safariPinnedTab: {
                pictureAspect: 'silhouette',
                themeColor: themeColor
            }
        },
        settings: {
            compression: 2,
            scalingAlgorithm: 'Cubic',
            errorOnImageTooSmall: false
        },
        markupFile: FAVICON_DATA_FILE
    }, function () {
        done();
    });
    gulp.src(theme + 'favicon/browserconfig.xml').pipe(gulp.dest(root));
});

gulp.task('check-for-favicon-update', function (done) {
    var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
    plugins.realFavicon.checkForUpdates(currentVersion, function (err) {
        if (err) {
            throw err;
        }
    });
});