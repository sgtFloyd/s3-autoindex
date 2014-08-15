$(function($) {
  var s3RestUrl = (function(){
    var url = window.S3_BUCKET_URL + '?delimiter=/',
        pathRegex = /.*[?&]path=([^&]+)(&.*)?$/,
        match = location.search.match(pathRegex);
    if (match) {
      var path = match[1].replace(/\/$/, '') + '/';
      url += '&prefix=' + path;
    }
    return url;
  }());

  Number.prototype.toBytes = function(){
    if (this === 0){ return '0 bytes'; }
    var i = parseInt(Math.floor(Math.log(this) / Math.log(1024))),
        r = Math.round(this / Math.pow(1024, i)*10)/10;
    return [r, ['bytes', 'KB', 'MB', 'GB', 'TB'][i]].join(' ');
  }
  Array.prototype.sortBy = function(field, direction) {
    var asc = direction === 'asc';
    return this.sort(function(a, b){
      if(a[field] < b[field]) return asc ? 1 : -1;
      if(a[field] > b[field]) return asc ? -1 : 1;
      return 0;
    });
  }

  var FILE_EXCLUDES = ['index.html', 'list.js', 'robots.txt', 'favicon.ico']
  function File(path, item){
    var key = item.find('Key').text();
    this.name = key.substring(path.length);
    this.title = this.name.split('-').slice(0,-1).join('-').trim();
    if( this.title.match(/^The\s/i) ) {
      this.title = this.title.replace(/^The\s/i,'')+', The';
    }
    this.date = new Date(item.find('LastModified').text());
    this.size = parseInt(item.find('Size').text());

    this.toRow = function(){
      // Don't render files without a name or those on the exclude list
      if (!this.name||FILE_EXCLUDES.indexOf(key)>-1){return;}
      return [
        '<tr>',
          '<td><span class="icon-android-book"></span></td>',
          '<td><a href="/', key, '">', this.name, '</a></td>',
          '<td>', this.date.toLocaleString(), '</td>',
          '<td>', this.size.toBytes(), '</td>',
        '</tr>'
      ].join('');
    }
  }

  function Directory(item) {
    var path = item.find('Prefix').text();
    this.name = path.split('/').slice(-2).join('/');
    this.title = this.name.split('-').slice(0,-1).join('-').trim();
    if( this.title.match(/^The\s/i) ) {
      this.title = this.title.replace(/^The\s/i,'')+', The';
    }
    this.href = location.pathname+'?path='+path;

    this.toRow = function(){
      return [
        '<tr>',
          '<td><span class="icon-android-folder"></span></td>',
          '<td><a href="', this.href, '">', this.name, '</a></td>',
          '<td></td><td>-</td>',
        '</tr>'
      ].join('');
    }
  }

  function ParentDirectory(parentPath){
    this.path = parentPath.replace(/\/$/, '')
      .split('/').slice(0, -1).concat('').join('/');

    this.toRow = function(){
      return [
        '<tr><td></td><td colspan=3>',
          '<a href="?path=', this.path, '">../</a>',
        '</td></tr>'
      ].join('');
    }
  }

  function FileList(xml) {
    var xml = $(xml), path = $(xml.find('Prefix')[0]).text();
    this.files = $.map(xml.find('Contents'),
          function(item){return new File(path, $(item));}),
    this.dirs = $.map(xml.find('CommonPrefixes'),
          function(item){return new Directory($(item));});

    this.render = function(){
      var output = $('#items tbody'); output.html('').parent().show();
      if(path){output.append(new ParentDirectory(path).toRow());}
      $.each(this.dirs, function(_,dir){output.append(dir.toRow());});
      $.each(this.files, function(_,file){output.append(file.toRow());});
    }
  }

  var fileList;
  $('.sortable').click(function(e){
    var $elem = $(this),
        direction = $elem.attr('data-dir'),
        field = $elem.attr('data-field');
    fileList.files = fileList.files.sortBy(field, direction);
    fileList.dirs = (field === 'title') ? fileList.dirs.sortBy(field, direction)
                                        : fileList.dirs.sortBy('title', 'desc');
    fileList.render();
    $('.sortable').removeClass('active'); $elem.addClass('active');
    $elem.attr('data-dir', direction === 'asc' ? 'desc' : 'asc');
  });

  $.get(s3RestUrl)
    .done(function(xml){
      $('#loading').hide();
      fileList = new FileList(xml);
      $('.sortable.active').click();
    })
    .fail(function(err){
      alert('There was an error');
      console.error(err);
    });
});
