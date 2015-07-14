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
    this.href = baseUrl + escape(key);
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
    this.href = location.pathname+'?path='+escape(path);

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
    this.path = escape(
      parentPath.replace(/\/$/, '').split('/').slice(0, -1).concat('').join('/')
    );

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

  var KeyStore = {
    setCookie: function(value) {
      document.cookie = 'decryptKey=' + value + '; path=/';
    },

    readCookie: function() {
      var decryptKey = 'decryptKey=';
      var cookies = document.cookie.split(';');
      for(var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) == ' ')
          cookie = cookie.substring(1, cookie.length);
        if (cookie.indexOf(decryptKey) == 0)
          return cookie.substring(decryptKey.length, cookie.length);
      }
      return null;
    },

    eraseCookie: function() {
      var expiration = 'expires=' + new Date(0).toUTCString();
      document.cookie = 'decryptKey=;' + expiration +'; path=/';
    }
  };

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

  var loadS3Bucket = function(url, callbacks) {
    if (url)
      $.get( buildRestUrl(url) )
        .done(callbacks.success)
        .fail(callbacks.failure);
    else callbacks.failure();
  };

  var decrypt = function(url, key) {
    try {
      var decrypted = CryptoJS.AES.decrypt(url, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch(err){}
  };

  var loadFileList = function(xml, baseUrl) {
    $('#loading, #login').hide();
    fileList = new FileList(xml, baseUrl);
    $('.sortable.active').click();
  };

  /* Encryption method used to manually generate SECRET_BUCKET_URL
  var encrypt = function(url, key) {
    return CryptoJS.AES.encrypt(url, key).toString();
  };
  */

  $('#login').on('submit', function(e){
    var key = $(this).find('input').val(),
        url = decrypt(window.SECRET_BUCKET_URL, key);
    $('#login').hide(); $('#loading').show();
    loadS3Bucket(url, {
      success: function(xml){ KeyStore.setCookie(key); loadFileList(xml, url); },
      failure: function(err){ alert('Incorrect Password'); init(); }
    });
    return false; // preventDefault submit
  });

  var init = function() {
    if (window.SECRET_BUCKET_URL) {
      if ( KeyStore.readCookie() ) {
        // Encrypted SECRET_BUCKET_URL, with existing decryption key
        var url = decrypt(window.SECRET_BUCKET_URL, KeyStore.readCookie());
        loadS3Bucket(url, {
          success: function(xml){ loadFileList(xml, url); },
          failure: function(err){ KeyStore.eraseCookie(); init(); }
        });
      } else {
        // Encrypted SECRET_BUCKET_URL, no decryption key
        $('#loading').hide();
        $('#login').show().find('input').focus();
      }
    } else {
      // S3_BUCKET_URL, no decryption key needed
      loadS3Bucket(window.S3_BUCKET_URL, {
        success: function(xml){ loadFileList(xml, window.S3_BUCKET_URL); },
        failure: function(err){ alert('Something went wrong.'); console.error(err); }
      });
    }
  };

  var _loops = 0,
  initAfterConfig = function() {
    _loops++; if(_loops>25) return init();
    if (window.S3_CONFIG_LOADED) init();
    else setTimeout(initAfterConfig, 25);
  }; initAfterConfig();

});
