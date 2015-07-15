module.exports = function(grunt) {
  var srcFiles = [
    'js/coreExt.js',
    'js/keyStore.js',
    'js/list.js'
  ];

  grunt.initConfig({
    concat: {
      dist: {src: srcFiles,
             dest: '.tmp/build.js'}
    },
    uglify: {
      dist: {src: '<%= concat.dist.dest %>',
             dest: 'js/list.min.js'}
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
