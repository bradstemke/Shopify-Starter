module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      build_staging: {
        options: {
          style: 'compressed'
        },
        files: {
          'staging/assets/style.css.liquid' : 'development/dev/stylesheets/style.scss'
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
        src: 'development/dev/scripts/utils/*.js',
        dest: 'staging/assets/plugins.js'
      }
    },

    copy: {
      templates_staging: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['development/templates/*'],
            dest: 'staging/templates/'
          }
        ]
      },
      layout_staging: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['development/layout/*'],
            dest: 'staging/layout/'
          }
        ]
      },
      snippets_staging: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['development/snippets/*'],
            dest: 'staging/snippets/'
          }
        ]
      },
      js_staging: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['development/dev/scripts/application.js'],
            dest: 'staging/assets'
          }
        ]
      },
      fonts_staging: {
        files: [
          {
            expand: true,
            flatten: true,
            src: 'development/dev/fonts/*',
            dest: 'staging/assets' }
        ]
      },
      images_staging: {
        files: [
          {
            expand: true,
            cwd: 'development/dev/images/',
            src: ['**/*.{png,jpg,svg,jpeg}'],
            dest: 'staging/assets/'
          }
        ]
      },
      templates_production: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['staging/templates/*'],
            dest: 'production/templates/'
          }
        ]
      },
      layout_production: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['staging/layout/*'],
            dest: 'production/layout/'
          }
        ]
      },
      snippets_production: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['staging/snippets/*'],
            dest: 'production/snippets/'
          }
        ]
      },
      assets_production: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['staging/assets/*'],
            dest: 'production/assets'
          }
        ]
      },
    },

    uglify: {
      build_staging_application: {
        src: 'staging/assets/application.js',
        dest: 'staging/assets/application.js'
      },
      build_staging_plugins: {
        src: 'staging/assets/plugins.js',
        dest: 'staging/assets/plugins.js'
      }
    },

    clean: {
      staging: ['staging/templates/*', 'staging/layout/*', 'staging/snippets/*', '!staging/config/', '!staging/.ruby-version', '!staging/config.yml'],
      production: ['production/templates/*', 'production/layout/*', 'production/snippets/*', '!production/config/', '!production/.ruby-version', '!production/config.yml'],
    },

  }); // END grunt.initConfig

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-imagemin');

  // Define Tasks
  grunt.registerTask('staging', [
    'clean:staging',
    'sass:build_staging',
    'concat:plugins',
    'copy:images_staging',
    'copy:js_staging',
    'copy:fonts_staging',
    'copy:templates_staging',
    'copy:layout_staging',
    'copy:snippets_staging',
    'uglify:build_staging_plugins',
    'uglify:build_staging_application',
  ]);

  // Define Tasks
  grunt.registerTask('production', [
    'clean:production',
    'copy:assets_production',
    'copy:templates_production',
    'copy:layout_production',
    'copy:snippets_production',
  ]);

};