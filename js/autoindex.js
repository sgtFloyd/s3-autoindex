$(function($) {
  var fileList,
  buildFileList = function(xml, baseUrl) {
    $('#loading, #login').hide();
    fileList = new FileList(xml, baseUrl);
    $('.sortable.active').click();
  };

  $('.sortable').click(function(e){
    var $elem = $(this), dir = $elem.attr('data-dir');
    fileList.sortBy( $elem.attr('data-field'), dir );
    fileList.render( $('#items tbody') );

    // Update headers to with the current sort options
    $('.sortable').removeClass('active'); $elem.addClass('active');
    $elem.attr('data-dir', dir === 'asc' ? 'desc' : 'asc');
  });

  $('#login').submit(function(e){
    var key = $(this).find('input').val(),
        url = decrypt(window.SECRET_BUCKET_URL, key);
    $('#login').hide(); $('#loading').show();
    loadS3Bucket(url, {
      success: function(xml){ KeyStore.setCookie(key); buildFileList(xml, url); },
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
          success: function(xml){ buildFileList(xml, url); },
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
        success: function(xml){ buildFileList(xml, window.S3_BUCKET_URL); },
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
