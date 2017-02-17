var KeyStore = { // eslint-disable-line no-unused-vars
  setCookie: function (value) {
    document.cookie = 'decryptKey=' + value + '; path=/'
  },

  readCookie: function () {
    var decryptKey = 'decryptKey='
    var cookies = document.cookie.split(';')
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i]
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length)
      }
      if (cookie.indexOf(decryptKey) === 0) {
        return cookie.substring(decryptKey.length, cookie.length)
      }
    }
    return null
  },

  eraseCookie: function () {
    var expiration = 'expires=' + new Date(0).toUTCString()
    document.cookie = 'decryptKey=;' + expiration + '; path=/'
  }
}
