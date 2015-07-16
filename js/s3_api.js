var buildS3Url = function(bucketUrl) {
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
    $.get( buildS3Url(url) )
      .done(callbacks.success)
      .fail(callbacks.failure);
  else callbacks.failure();
};
