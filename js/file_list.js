function FileList(xml, baseUrl) {
  var $xml = $(xml),
      path = $($xml.find('Prefix')[0]).text(),

  dirs = $.map($xml.find('CommonPrefixes'), function(item){
    return new Directory( $(item) );
  }).sortBy('title', 'desc'),

  files = $.map($xml.find('Contents'), function(item){
    return new File( path, $(item), baseUrl );
  }),

  template = $('#rowTemplate').text(),
  renderRow = function(attrs) {
    var output = template, match;
    while (match = /{{(\w+)}}/.exec(output))
      output = output.replace(match[0], attrs[match[1]] || "");
    return output;
  };

  this.sortBy = function(field, direction) {
    files = files.sortBy(field, direction);
  }

  this.render = function($target) {
    var items = [];
    if (path) items.push( new ParentDirectory(path) );
    items = items.concat(dirs, files);
    $target.html('').parent().show(); // Clear any existing content
    items.forEach(function(row) {
      if (row.name) $target.append(renderRow(row));
    });
  }
}

function File(path, item, baseUrl){
  var file = item.find('Key').text(),
      name = file.substring(path.length);
  return {
    icon: 'ion-document-text',
    name: name,
    title: name.replace(/^The\s*/i,''),
    href: baseUrl + escape(file),
    date: new Date(item.find('LastModified').text()).toLocaleString(),
    size: parseInt(item.find('Size').text()).toBytes()
  };
}

function Directory(item) {
  var path = item.find('Prefix').text(),
      name = path.split('/').slice(-2).join('/');
  return {
    icon: 'ion-ios7-folder',
    name: name,
    title: name.replace(/^The\s*/i,''),
    href: location.pathname+'?path='+escape(path),
    size: '-'
  };
}

function ParentDirectory(parentPath){
  var path = parentPath.replace(/\/$/, '')
    .split('/').slice(0, -1).concat('').join('/');
  return {
    icon: 'ion-arrow-return-left',
    name: '../',
    href: location.pathname+'?path='+escape(path),
  };
}
