module.exports = function (source, map) {
    console.log('source that i got was', source);
    this.callback(
        null,
        source,
        map
    )
}