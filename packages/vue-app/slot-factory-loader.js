module.exports = function (source, map) {
    if (typeof source !== 'string') {
        throw new Error('Expected string in slot-factory-loader');
    }

    const newSource = source
        .replace(
            /<SlotFactory \/>/g,
            '<slot></slot><SlotFactory \/>'
        );

    this.callback(
        null,
        newSource,
        map
    )
}