var buildS3Url = function(bucketUrl, marker) {
  var url = bucketUrl + '?delimiter=/',
      path = location.search.match(/.*[?&]path=([^&]+)(&.*)?$/);
  if (path) url += '&prefix=' + path[1].replace(/\/$/,'') + '/';
  if (marker) url += '&marker=' + marker;
  return url;
};

var loadS3Bucket = function(url, callbacks, total) {
  $('#loading').append('.');
  if (total)
    var contents = $(total).find('Contents, CommonPrefixes'),
        marker = contents.last().find('Key, Prefix').text();

  if (url)
    $.get( buildS3Url(url, marker) )
      .done(function(xml) {
        var isTruncated = $(xml).find('IsTruncated').text();
        // Combine the results with any previous pages
        xml = $(xml).find('ListBucketResult').prepend(contents);
        isTruncated === 'false' ? callbacks.success(xml)
                                : loadS3Bucket(url, callbacks, xml);
      }).fail(callbacks.failure);
  else callbacks.failure();
};
