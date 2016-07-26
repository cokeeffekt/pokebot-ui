exports.config = {
  paths: {
    watched: ['app']
  },
  files: {
    javascripts: {
      joinTo: {
        'javascripts/vendor.js': /^bower_components/,
        'javascripts/app.js': /^app/
      },
      order: {
        before: [
          'bower_components/jquery/dist/jquery.js'
        ]
      }
    },
    stylesheets: {
      joinTo: {
        'stylesheets/app.css': /^app/,
        'stylesheets/vendor.css': /^bower_components/
      }
    },
    templates: {
      joinTo: {
        'javascripts/tpl.js': /^app\/modules\//
      }
    }
  },
  npm: {
    enabled: false
  },
  server: {
    hostname: '0.0.0.0',
    port: 5001,
    run: true
  },
  plugins: {
    assetsmanager: {
      copyTo: {
        'fonts': ['bower_components/font-awesome/fonts/*']
      }
    },
    html2js: {
      options: {
        base: 'app/modules',
        htmlmin: {
          removeComments: true
        }
      }
    },
    stylus: {
      includeCss: true
    },
  },
  overrides: {
    production: {
      sourceMaps: true
    }
  }
};
