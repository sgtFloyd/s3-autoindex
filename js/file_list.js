var FileList = {
  dirs: [], files: [],

  processXML: function($xml) {
    var self = this;
    self.prefix = $xml.find('Prefix:first').text();
    $xml.find('CommonPrefixes').each(function(_, node){
      self.dirs.push( new Directory($(node)) );
    });
    $xml.find('Contents').each(function(_, node){
      self.files.push( new File(self.prefix, $(node), self.root) );
    });
  },

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
    this.template = $('#rowTemplate').text();
    $target.html('').parent().show(); // Clear any existing content

    if (this.prefix)
      $target.append( this.renderRow(new ParentDirectory(this.prefix)) );
    this.dirs.forEach(function(dir) {
      if (dir.name) $target.append(this.renderRow(dir));
    }, this);
    this.files.forEach(function(file) {
      if (file.name) $target.append(this.renderRow(file));
    }, this);
  }
}

function File(path, item, bucketUrl){
  var file = item.find('Key').text(),
      name = file.substring(path.length),
      size = parseInt(item.find('Size').text());
  return {
    icon: 'ion-document-text',
    name: name,
    title: name.replace(/^The\s*/i,''),
    href: bucketUrl + escape(file),
    date: new Date(item.find('LastModified').text()).toLocaleString(),
    size: size,
    sizeStr: size.toBytes()
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
    sizeStr: '-'
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
