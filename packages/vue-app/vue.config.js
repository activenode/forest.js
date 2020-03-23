module.exports = {
  configureWebpack: config => {
    const rules = config.module.rules;

    config.module.rules = [
      {
        oneOf: [
          {
            test: /\.vue$/,
            resourceQuery: /type=(template)/,
            use: [
              {
                loader: require.resolve('./slot-factory-loader.js')
              },
            ]
          }
        ],
      },
      ...rules,
    ];
  }
}