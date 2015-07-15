$(function($) {
  function File(path, item, baseUrl){
    var key = item.find('Key').text(),
        name = key.substring(path.length);

    var props = {
      name: name,
      title: name.replace(/^The\s*/i,''),
      href: baseUrl + escape(key),
      date: new Date(item.find('LastModified').text()).toLocaleString(),
      size: parseInt(item.find('Size').text()).toBytes()
    };
// props = {
//   name: 'NAME',
//   href: 'HREF',
//   title: 'TITLE',
//   date: 'DATE',
//   size: 'SIZE'
// }
//
// var template = document.getElementById('rowTemplate').text,
//     handlebars = template.match(/{{\w+}}/g);
//
// handlebars.forEach(function(var){})
// $.each(props, function(key, val){})
//
// var template = document.getElementById('rowTemplate').text,
//     props = {name: 'NAME',href: 'HREF',title: 'TITLE',date: 'DATE',size: 'SIZE'};
//
//
// var render = function(template, props) {
//   var pattern = /{{(\w+)}}/, match;
//   while ( match = pattern.exec(template) )
//     template = template.replace(match[0], props[match[1]]||"" );
//   return template;
// }


    this.toRow = function(){
      if(!name){ return; }
      return render(template, props)
    }
  }

  function Directory(item) {
    var path = item.find('Prefix').text();
    this.name = path.split('/').slice(-2).join('/');
    this.title = this.name.trim();
    if( this.title.match(/^The\s/i) ) {
      this.title = this.title.replace(/^The\s/i,'');
    }
    this.href = location.pathname+'?path='+escape(path);

    this.toRow = function(){
      if(!this.name){return;}
      return [
        '<tr>',
          '<td nowrap><span class="ion-ios7-folder"></span></td>',
          '<td nowrap><a href="', this.href, '">', this.name, '</a></td>',
          '<td nowrap></td><td>-</td>',
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
      if(path) output.append(new ParentDirectory(path).toRow());
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

  var loadS3Bucket = function(url, callbacks) {
    if (url)
      $.get( buildRestUrl(url) )
        .done(callbacks.success)
        .fail(callbacks.failure);
    else callbacks.failure();
  };

  var loadFileList = function(xml, baseUrl) {
    $('#loading, #login').hide();
    fileList = new FileList(xml, baseUrl);
    $('.sortable.active').click();
  };

  var decrypt = function(url, key) {
    try {
      var decrypted = CryptoJS.AES.decrypt(url, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch(err){}
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
