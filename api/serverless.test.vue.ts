import { NowRequest, NowResponse } from '@now/node';
import Vue from 'vue';
import '../vue-sample/CounterComponent';
import { createRenderer } from 'vue-server-renderer';

export default (req: NowRequest, res: NowResponse) => {
  const renderer = createRenderer();

  const app = new Vue({
    data: {},
    template: `<counter-component customText="foobar" />`,
  });

  renderer.renderToString(app, (err, html) => {
    // page title will be "Hello"
    // with meta tags injected
    if (err) {
      return res.json(err);
    }
    res.send(html);
  });
  //res.json({ name: 'Foo', email: 'bar@foobar.foo' })
}