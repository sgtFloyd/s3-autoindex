/* global CryptoJS */
var decrypt = function (url, key) { // eslint-disable-line no-unused-vars
  try {
    var decrypted = CryptoJS.AES.decrypt(url, key)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (err) {}
}

// Encryption method used to manually generate SECRET_BUCKET_URL
var encrypt = function (url, key) {
  return CryptoJS.AES.encrypt(url, key).toString()
}
