module.exports = function(grunt) {
  var srcFiles = [
    'js/vendor/jquery.js',
    'js/vendor/crypto-js.js',
    'js/core_ext.js',
    'js/encryption.js',
    'js/file_list.js',
    'js/key_store.js',
    'js/s3_api.js',
    'js/autoindex.js'
  ];

  grunt.initConfig({
    concat: {
      dist: {src: srcFiles,
             dest: '.tmp/build.js'}
    },
    uglify: {
      dist: {src: '<%= concat.dist.dest %>',
             dest: 'js/dist.min.js'}
    },
    watch: {
      files: srcFiles,
      tasks: ['concat', 'uglify']
    },
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['concat', 'uglify']);
};
