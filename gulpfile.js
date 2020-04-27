"use strict";
var options = {};

// #############################
// Réglages des différents chemins
// #############################

var basePaths = {
    project:  './',
    projectsourcemap:  '../',
    src: './sass/**/*.scss', // fichiers scss à surveiller
    dest:  './css/', // dossier CSS à livrer du projet
    tpl: '**/*.tpl.php',
    node_modules: './node_modules/',
    gems:'/home/webmaster/vendor/bundle/gems/',
    drushscript:'/home/webmaster/.config/composer/vendor/drush/drush/drush.php',
    drushd6aliasfile:'/home/webmaster/.drush/sitesvmd6.aliases.drushrc.php',
    drushd8aliasfile:'/home/webmaster/.drush/sitesvmd8.aliases.drushrc.php'
};

//Chemins spécifiques
var folderPaths = {
    styles: {
        src: basePaths.projectsourcemap + 'sass/',
        dest: basePaths.theme + 'css/'
    },
    images: {
        src: basePaths.project + 'images/',
        dest: basePaths.theme + 'images/'
    },
    templates: {
        d6: basePaths.project + '**/*.tpl.php',
        d6nodestpl: basePaths.project + 'node/**/*.tpl.php',
        d8: basePaths.project + '**/*.html.twig',
        d8nodestpl: basePaths.project + 'nodes/**/*.html.twig'
    },
    settings: {
        d6: basePaths.project + '**/*.php',
        d8: basePaths.project + '**/*.php'
    },
    js: {
        jsd68: basePaths.project + 'js/**/*.js'
    },
    ymlsettings: {
        d8yml: basePaths.project + '**/*.yml'
    }
};

//Variable pour les gems (à adapter selon environnement)
// File paths to various assets are defined here.
var assetsPath = {
  gems: [
//    basePaths.gems + 'susy-2.2.2/sass',
    basePaths.gems + 'breakpoint-2.7.1/stylesheets'


  ],
   node_modules: [
       //Ajoutés avec les gems pour simplifier
    basePaths.node_modules +  'node-normalize-scss',
    basePaths.node_modules +  'susy/sass',
    basePaths.node_modules +  'typey/stylesheets/_typey.scss'
  ],
  javascript: [


  ]
};
// Requis
var gulp = require('gulp');
var browserSync = require('browser-sync').create(); // create a browser sync instance.
var bs_reload = browserSync.reload;
var bs_stream = browserSync.stream();

// Include plugins
// tous les plugins de package.json
var postcss = require('gulp-postcss');
var plugins = require('gulp-load-plugins')();
var gutil = require('gulp-util');
var gcache = require('gulp-cache');
//Plugins de PostCSS
var autoprefixer = require('autoprefixer');

//Synchro des fichiers CSS compilés pour BS qd compilation locale
//var gnewer = require('gulp-newer');
//var merge = require('merge2');


// Autoprefixer : Navigateurs à cibler pour le préfixage CSS
// Liste fourni depuis 06/19 par .browserslistrc - Editer pour modifier.
/*var AUTOPREFIXER = [

'> 1%',
'ie >= 8',
'edge >= 15',
'ie_mob >= 10',
'ff >= 45',
'chrome >= 45',
'safari >= 7',
'opera >= 23',
'ios >= 7',
'android >= 4',
'bb >= 10'
];*/

//Tableau pour utiliser les plugins de PostCSS
//https://webdesign.tutsplus.com/tutorials/postcss-quickstart-guide-gulp-setup--cms-24543
var processors = [
  autoprefixer(  {
                                //browsers: AUTOPREFIXER,
                                // browserslist fourni la liste des navigateurs
                                cascade: false,
                                //activation du prefixage pour grid
                                grid: true
                            })

//  cssnext,n'existe plus - 06/19
//  precss
];
// A display error function, to format and make custom errors more uniform
// Could be combined with gulp-util or npm colors for nicer output
//var displayError = function(error) {
//    // Initial building up of the error
//    var errorString = '[' + error.plugin + ']';
//    errorString += ' ' + error.message.replace("\n",''); // Removes new line at the end
//    // If the error contains the filename or line number add it to the string
//    if(error.fileName)
//        errorString += ' in ' + error.fileName;
//    if(error.lineNumber)
//        errorString += ' on line ' + error.lineNumber;
//    // This will output an error like the following:
//    // [gulp-sass] error message in file_name on line 1
//    console.error(errorString);
//}

//Variables spécifiques au thèmes
var urlSite = ['http://d8-le-rocher.vmdev/'];
var aliasDrush = ['@vmdevd8lr'];
// #############################
// Tâches à accomplir - Tasks
// #############################
//
//
gulp.task('sasscompil', function () {
    return gulp.src(basePaths.src)
//    return gulp.src('./sass/**/*.scss')
        .pipe(plugins.plumber(function(error) {
        gutil.log(gutil.colors.red(error.message));
        this.emit('end');
        }))
        //Notification d'erreur
        .pipe(plugins.plumber({ errorHandler: function(err) {
            notify.onError({
                title: "Gulp error in " + err.plugin,
                message:  err.toString()
            })(err);

            // play a sound once
            gutil.beep();
        }}))
            .pipe(plugins.sourcemaps.init()) // Création du sourcemaps
            .pipe(plugins.sass({
                noCache: true,
                outputStyle: 'compressed',
                errLogToConsole: true,
                sourceComments: 'normal',
                debugInfo: true,
                includePaths: [].concat(
                        assetsPath.gems,
                        assetsPath.node_modules,
                        folderPaths.styles.src
                        )
            }).on('error', plugins.sass.logError))
           .pipe(postcss(processors))//Utilisation des plugins de PostCSS dont Autoprefixer (Voir plus haut)
            .pipe(plugins.sourcemaps.write('.', {sourceRoot: folderPaths.styles.src}))//Pour créer le fichier css.map à coté du css
            .pipe(gulp.dest(basePaths.dest))
            .pipe(plugins.size({title: 'Taille du fichier css'}))
            .pipe(plugins.notify({
                title: "SASS Compilé - Fichier Map créé",
                message: "Les fichiers SCSS sont compilés dans le dossier CSS",
                onLast: true
            }))
            .pipe(bs_reload({stream: true}))// rechargement des navigateurs par BS après compilation
            ;
});

//Vidage de cache Drupal avec Drush
gulp.task('drush', function() {
  return gulp.src(basePaths.drushscript, {
      read: false
    })

    .pipe(plugins.shell([
      'drush @vmdevd8lr cron && drush @vmdevd8lr cc all'

    ]))
    .pipe(plugins.notify({
      title: "Vidage de Cache",
      message: "Cache Drupal vidé complètement.",
      onLast: true
    }));
});

//Synchro de fichiers ou dossiers
gulp.task('sync', function(done) {
    return merge(
        // Master directory one, we take all files except those
        // starting with two underscores
        //gulp.src(['./one/**/*', '!./one/**/__*'])
        gulp.src(basePaths.dest)
        // check if those files are newer than the same named
        // files in the destination directory
            .pipe(newer('./two'))
        // and if so, copy them
            .pipe(gulp.dest('./two')),
        // Slave directory, same procedure here
        gulp.src(['./two/**/*', '!./two/**/__*'])
            .pipe(newer('./one'))
            .pipe(gulp.dest('./one'))
    );
});

//Initialisation de la tâche de browser-sync
gulp.task('browser-sync', function() {
browserSync.init({
        //changer l'adresse du site pour lequel utiliser browserSync, solution par variable fonctionne pas
//        proxy: '.urlSite.',
        proxy: 'http://d8-le-rocher.vmdev/',
        open: false,
        logLevel: 'info',//pour avoir toutes les infos ,utiliser "debug", pour infos de base "info"
        logConnections: true
    });
});
//Vidage de cache automatisé avec gulp-cache
gulp.task('clearCache', function (done) {
   return cache.clearAll(done)
   .pipe(plugins.notify({
     title: "Vidage de Cache avec gulp-cache",
     message: "Cache vidé complètement.",
     onLast: true
   }));
});
//Tâche de surveillance et d'automatisation - Option1 Serveur LAMP Option2 Compilation Locale
// Default pour compilation et BS sur même machine
gulp.task('default', ['browser-sync'], function(){
  gulp.watch(basePaths.src, ['sasscompil']);
  //gulp.watch(basePaths.project, ['clearCache']);
  //gulp.watch(folderPaths.templates.d8nodestpl,['clearCache'],bs_reload);
  gulp.watch(folderPaths.images.src, bs_reload);
  gulp.watch(folderPaths.images.dest, bs_reload);
  gulp.watch(folderPaths.styles.src, bs_reload);
  gulp.watch(folderPaths.templates.d8, bs_reload);
//  gulp.watch(folderPaths.templates.d6nodestpl, bs_reload);
  gulp.watch(folderPaths.settings.d8, bs_reload);
  gulp.watch(folderPaths.js.jsd68, bs_reload);
  gulp.watch(folderPaths.ymlsettings.d8yml, bs_reload);
//  gulp.watch(basePaths.src, ['drush']);
//  gulp.watch(folderPaths.templates.d6, ['drush']);
//  gulp.watch(folderPaths.js.jsd68, ['drush']);
});

//Compilation Poste Locale Sans BS + Surveillance
gulp.task('localcompile', function(){
  gulp.watch(basePaths.src, ['sasscompil']);
  //gulp.watch(basePaths.project, ['clearCache']);
  //gulp.watch(folderPaths.templates.d8nodestpl,['clearCache'],bs_reload);
  gulp.watch(folderPaths.images.src, bs_reload);
  gulp.watch(folderPaths.images.dest, bs_reload);
  gulp.watch(folderPaths.styles.src, bs_reload);
  gulp.watch(folderPaths.templates.d8, bs_reload);
//  gulp.watch(folderPaths.templates.d6nodestpl, bs_reload);
  gulp.watch(folderPaths.settings.d8, bs_reload);
  gulp.watch(folderPaths.js.jsd68, bs_reload);
  gulp.watch(folderPaths.ymlsettings.d8yml, bs_reload);
//  gulp.watch(basePaths.src, ['drush']);
//  gulp.watch(folderPaths.templates.d6, ['drush']);
//  gulp.watch(folderPaths.js.jsd68, ['drush']);
});

//BS seul avec Surveillance - Pas de compilation
gulp.task('browser-sync', function(){
  //gulp.watch(basePaths.project, ['clearCache']);
  //gulp.watch(folderPaths.templates.d8nodestpl,['clearCache'],bs_reload);
  gulp.watch(folderPaths.images.src, bs_reload);
  gulp.watch(folderPaths.images.dest, bs_reload);
  gulp.watch(folderPaths.styles.src, bs_reload);
  gulp.watch(folderPaths.templates.d8, bs_reload);
//  gulp.watch(folderPaths.templates.d6nodestpl, bs_reload);
  gulp.watch(folderPaths.settings.d8, bs_reload);
  gulp.watch(folderPaths.js.jsd68, bs_reload);
  gulp.watch(folderPaths.ymlsettings.d8yml, bs_reload);
//  gulp.watch(basePaths.src, ['drush']);
//  gulp.watch(folderPaths.templates.d6, ['drush']);
//  gulp.watch(folderPaths.js.jsd68, ['drush']);
});
