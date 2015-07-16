var FileList = {
  dirs: [], files: [],

  renderRow: function(attrs) {
    var output = this.template, match;
    while (match = /{{(\w+)}}/.exec(output))
      output = output.replace(match[0], attrs[match[1]] || "");
    return output;
  },

  sortBy: function(field, direction) {
    this.files = this.files.sortBy(field, direction);
    this.dirs = this.dirs.sortBy('title', 'desc');
  },

  render: function($target) {
    var items = [];
    if (this.prefix)
      items.push( new ParentDirectory(this.prefix) );

    this.dirs.forEach(function(dir){
      items.push( new Directory($(dir)) );
    });
    this.files.forEach(function(file){
      items.push(new File(this.prefix, $(file), this.root))
    }, this);

    this.template = $('#rowTemplate').text();
    $target.html('').parent().show(); // Clear any existing content
    items.forEach(function(row) {
      if (row.name) $target.append(this.renderRow(row));
    }, this);
  }
}

function File(path, item, bucketUrl){
  var file = item.find('Key').text(),
      name = file.substring(path.length);
  return {
    icon: 'ion-document-text',
    name: name,
    title: name.replace(/^The\s*/i,''),
    href: bucketUrl + escape(file),
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
