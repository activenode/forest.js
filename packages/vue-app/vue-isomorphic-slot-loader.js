module.exports = function (source, map) {
    if (typeof source !== 'string') {
        throw new Error('Expected string in slot-factory-loader');
    }

    const newSource = source
        .replace(
            /<IsomorphicSlot \/>/g,
            '<slot></slot>'
        );

    this.callback(
        null,
        newSource,
        map
    )
}