module.exports = {
  configureWebpack: config => {
    console.log('cockfig', config);

    config.module.rules = config.module.rules.map(( rule ) => {
      const { test: testRule } = rule;

      if (testRule.test('.vue')) {
        console.log('testrule.vue', rule);
      }

      if (testRule.test('.vue') && rule.enforce !== 'pre') {
        return {
          ...rule,
          use: [
            {
              resourceQuery: /blockType=(docs)/,
              loader: require.resolve('./slot-factory-loader.js')
            },
            ...rule.use,
          ]
        };
      }
      return rule;
    });
      //console.log('wp', config);
    // config.module
    //   .rule('vue')
    //     .test(/\.vue$/)
    //       .resourceQuery(/blockType=(html|template)/)
    //       .use('vue')
    //         .loader(require.resolve('./slot-factory-loader.js'))
    //         .end()
    //       .use('vue')
    //         .loader('vue-loader')
    //         .end()

    // config.module.rule('vue')
    //     .resourceQuery(/blockType=(docs)/)
    //     .use('vue')
    //       .loader(require.resolve('./slot-factory-loader.js'))
    //       .end()


    //.uses
    // config.module
    //   .rule('vue')
    //     .test(/\.vue$/)
    //       .resourceQuery(/blockType=(html|template)/)
    //       .loader(require.resolve('./slot-factory-loader.js'))
    //       .end()
  }
}