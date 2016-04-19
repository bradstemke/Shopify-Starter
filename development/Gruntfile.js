module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      sass: {
        files: 'dev/stylesheets/**/*.scss',
        tasks: 'sass:dev'
      },
      js: {
        files: ['dev/scripts/application.js', 'dev/scripts/plugins.js'],
        tasks: 'copy:js'
      }
    },

    sass: {
      dev: {
        options: {
          style: 'expanded'
        },
        files: {
          'assets/style.css.liquid' : 'dev/stylesheets/style.scss'
        }
      },
      build: {
        options: {
          style: 'compressed'
        },
        files: {
          'assets/style.css.liquid' : 'dev/stylesheets/style.scss'
        }
      }
    },

    concat: {
      options: {
        stripBanners: true,
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> */',
      },
      plugins: {
        src: 'dev/scripts/utils/*.js',
        dest: 'dev/scripts/plugins.js'
      }
    },

    copy: {
      modernizr: {
        files: [
          {
            expand: true,
            flatten: true,
            src: 'dev/scripts/modernizr.min.js',
            dest: 'assets'
          }
        ]
      },
      js: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['dev/scripts/application.js','dev/scripts/plugins.js'],
            dest: 'assets'
          }
        ]
      },
      fonts: {
        files: [
          {
            expand: true,
            flatten: true,
            src: 'dev/fonts/*',
            dest: 'assets' }
        ]
      },
      svg: {
        files: [
          {
            expand: true,
            flatten: true,
            src: 'dev/images/*.svg',
            dest: 'assets'
          }
        ]
      }
    },

    uglify: {
      build_application: {
        src: 'dev/scripts/application.js',
        dest: 'assets/application.js',
      },
      build_plugins: {
        src: 'dev/scripts/plugins.js',
        dest: 'assets/plugins.js'
      }
    },

    // imagemin: {
    //   build: {
    //     options: { optimizationLevel: 3 },
    //     files: [{
    //       expand: true,
    //       cwd: 'dev/images/',
    //       src: ['**/*.jpg', '**/*.png'],
    //       dest: 'assets/'
    //     }]
    //   }
    // },

  }); // END grunt.initConfig

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-imagemin');

  // Define Tasks
  grunt.registerTask('build', [
    'sass:build',
    'concat:plugins',
    'uglify:build_plugins',
    'uglify:build_application',
    'copy:modernizr',
    'copy:svg'
  ]);

};