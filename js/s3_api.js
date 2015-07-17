var buildS3Url = function(bucketUrl, marker) {
  var url = bucketUrl + '?delimiter=/',
      path = location.search.match(/.*[?&]path=([^&]+)(&.*)?$/);
  if (path) url += '&prefix=' + path[1].replace(/\/$/,'') + '/';
  if (marker) url += '&marker=' + marker;
  return url;
};

var loadS3Bucket = function(url, callbacks, marker) {
  $('#loading').append('.');
  if (url)
    $.get( buildS3Url(url, marker) )
      .done(function(xml) {
        var $xml = $(xml);
        FileList.processXML($xml);

        var isTruncated = $xml.find('IsTruncated').text();
        if (isTruncated === 'false') callbacks.success();
        else {
          var marker = $xml.find('ListBucketResult')
            .children(':last').find('Key, Prefix').text();
          loadS3Bucket(url, callbacks, marker); // Load the next page
        }
      }).fail(callbacks.failure);
  else callbacks.failure();
};
