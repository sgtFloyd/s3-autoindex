/* global $, FileList KeyStore loadS3Bucket decrypt alert */
$(function ($) {
  var showFileList = function () {
    $('#loading, #login').hide()
    $('.sortable.active').click()
  }

  $('.sortable').click(function (e) {
    var $elem = $(this)
    var dir = $elem.attr('data-dir')
    FileList.sortBy($elem.attr('data-field'), dir)
    FileList.render($('#items tbody'))

    // Update headers with the current sort options
    $('.sortable').removeClass('active'); $elem.addClass('active')
    $elem.attr('data-dir', dir === 'asc' ? 'desc' : 'asc')
  })

  $('#login').submit(function (e) {
    var key = $(this).find('input').val()
    var url = decrypt(window.SECRET_BUCKET_URL, key)
    $('#login').hide(); $('#loading').show()
    FileList.root = url
    loadS3Bucket(url, {
      success: function () { KeyStore.setCookie(key); showFileList(url) },
      failure: function () { alert('Incorrect Password'); init() }
    })
    return false // preventDefault submit
  })

  var init = function () {
    if (window.SECRET_BUCKET_URL) {
      if (KeyStore.readCookie()) {
        // Encrypted SECRET_BUCKET_URL, with existing decryption key
        var url = decrypt(window.SECRET_BUCKET_URL, KeyStore.readCookie())
        FileList.root = url
        loadS3Bucket(url, {
          success: function () { showFileList() },
          failure: function () { KeyStore.eraseCookie(); init() }
        })
      } else {
        // Encrypted SECRET_BUCKET_URL, no decryption key
        $('#loading').hide()
        $('#login').show().find('input').focus()
      }
    } else {
      // S3_BUCKET_URL, no decryption key needed
      FileList.root = window.S3_BUCKET_URL
      loadS3Bucket(window.S3_BUCKET_URL, {
        success: function () { showFileList() },
        failure: function (err) { alert('Something went wrong.'); console.error(err) }
      })
    }
  }

  var _loops = 0
  var initAfterConfig = function () {
    _loops++; if (_loops > 25) return init()
    if (window.S3_CONFIG_LOADED) init()
    else setTimeout(initAfterConfig, 25)
  }; initAfterConfig()
})
