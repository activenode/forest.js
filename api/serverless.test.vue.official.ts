import { NowRequest, NowResponse } from '@now/node';
import Vue from 'vue';
import '../vue-sample/CounterComponent';
import { createRenderer } from 'vue-server-renderer';
import wrap from '@vue/web-component-wrapper';

const Component = {
  // any component options
  template: 'Hello Component',
  name: 'x-foo'
}

const CustomElement = wrap(Vue, Component)

//window.customElements.define('x-foo', CustomElement)


export default (req: NowRequest, res: NowResponse) => {
  const renderer = createRenderer();

  const app = new Vue({
    data: {},
    template: `<div>
      <x-foo>adfsafsdadfs<x-foo>
    </div>`,
  });

  renderer.renderToString(app, (err, html) => {
    // page title will be "Hello"
    // with meta tags injected
    if (err) {
      return res.json({err});
    }
    res.send(html);
  });
  //res.json({ name: 'Foo', email: 'bar@foobar.foo' })
}