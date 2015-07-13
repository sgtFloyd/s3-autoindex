$(function($) {
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

  var FILE_EXCLUDES = ['.htpasswd', 'index.html', 'robots.txt', 'favicon.ico'];
  function File(path, item, baseUrl){
    var key = item.find('Key').text();
    this.name = key.substring(path.length);
    this.href = baseUrl + key;
    this.title = this.name.split('-').slice(0,-1).join('-').trim();
    if( this.title.match(/^The\s/i) ) {
      this.title = this.title.replace(/^The\s/i,'')+', The';
    }
    this.date = new Date(item.find('LastModified').text());
    this.size = parseInt(item.find('Size').text());

    this.toRow = function(){
      if (!this.name||FILE_EXCLUDES.indexOf(key)>-1){return;}
      return [
        '<tr>',
          '<td><span class="ion-document-text"></span></td>',
          '<td><a href="', this.href, '">', this.name, '</a></td>',
          '<td>', this.date.toLocaleString(), '</td>',
          '<td>', this.size.toBytes(), '</td>',
        '</tr>'
      ].join('');
    }
  }

  var DIRECTORY_EXCLUDES = ['fonts/', 'js/'];
  function Directory(item) {
    var path = item.find('Prefix').text();
    this.name = path.split('/').slice(-2).join('/');
    this.title = this.name.split('-').slice(0,-1).join('-').trim();
    if( this.title.match(/^The\s/i) ) {
      this.title = this.title.replace(/^The\s/i,'')+', The';
    }
    this.href = location.pathname+'?path='+path;

    this.toRow = function(){
      if (!this.name||DIRECTORY_EXCLUDES.indexOf(this.name)>-1){return;}
      return [
        '<tr>',
          '<td><span class="ion-ios7-folder"></span></td>',
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
        '<tr><td class="ion-arrow-return-left">',
        '</td><td colspan=3>',
          '<a href="?path=', this.path, '">../</a>',
        '</td></tr>'
      ].join('');
    }
  }

  function FileList(xml, baseUrl) {
    var xml = $(xml), path = $(xml.find('Prefix')[0]).text();
    this.files = $.map(xml.find('Contents'),
          function(item){return new File(path, $(item), baseUrl);}),
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

  var buildRestUrl = function(bucketUrl) {
    var url = bucketUrl + '?delimiter=/',
        pathRegex = /.*[?&]path=([^&]+)(&.*)?$/,
        match = location.search.match(pathRegex);
    if (match) {
      var path = match[1].replace(/\/$/, '') + '/';
      url += '&prefix=' + path;
    }
    return url;
  };

  var loadS3Bucket = function(bucketUrl, key) {
    if (key) bucketUrl = decrypt(window.SECRET_BUCKET_URL, key);
    var url = bucketUrl.replace(/\/$/, '') + '/';
    $.get( buildRestUrl(url) )
      .done(function(xml){
        if (key) writeCookie(key);
        $('#loading').hide();
        fileList = new FileList(xml, url);
        $('.sortable.active').click();
      })
      .fail(function(err){
        if (key) {
          alert('Incorrect Password');
          writeCookie("", -1); // Erase Cookie
          init(); // Reset page
        } else alert('There was an error');
        console.error(err);
      });
  };

  var decrypt = function(url, key) {
    var decrypted = CryptoJS.AES.decrypt(url, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  };

  var encrypt = function(url, key) {
    return CryptoJS.AES.encrypt(url, key).toString();
  };

  var readCookie = function(){};
  var writeCookie = function(value, expiration){};

  $('#login').on('submit', function(e){
    var key = $(this).find('input').val();
    $('#login').hide(); $('#loading').show();
    loadS3Bucket(window.SECRET_BUCKET_URL, key);
    return false; // preventDefault submit
  });

  var init = function() {
    if (window.SECRET_BUCKET_URL) {
      var preAuth = readCookie();
      if ( preAuth ) {
        loadS3Bucket(window.SECRET_BUCKET_URL, preAuth);
      } else {
        $('#loading').hide();
        $('#login').show();
      }
    } else {
      loadS3Bucket(window.S3_BUCKET_URL);
    }
  }; init();

});
