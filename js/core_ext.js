/* eslint-disable no-extend-native */
Number.prototype.toBytes = function () {
  if (this === 0) { return '0 bytes' }
  var i = parseInt(Math.floor(Math.log(this) / Math.log(1024)))
  var r = Math.round(this / Math.pow(1024, i) * 10) / 10
  return [r, ['bytes', 'KB', 'MB', 'GB', 'TB'][i]].join(' ')
}

Array.prototype.sortBy = function (field, direction) {
  var asc = direction === 'asc'
  return this.sort(function (a, b) {
    if (a[field] < b[field]) return asc ? 1 : -1
    if (a[field] > b[field]) return asc ? -1 : 1
    return 0
  })
}
