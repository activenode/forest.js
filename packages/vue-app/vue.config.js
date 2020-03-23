module.exports = {
  configureWebpack: config => {
    const rules = config.module.rules;

    // the "oneOf" on root level is required because
    config.module.rules = [
      {
        oneOf: [
          {
            test: /\.vue$/,
            resourceQuery: /type=(template)/,
            use: [
              {
                loader: require.resolve('./vue-isomorphic-slot-loader.js')
              },
            ]
          }
        ],
      },
      ...rules,
    ];
  }
}