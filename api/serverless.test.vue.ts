import { NowRequest, NowResponse } from '@now/node';
import Vue from 'vue';
import '../vue-sample/CounterComponent';
import { createRenderer } from 'vue-server-renderer';
import vueCustomElement from 'vue-custom-element'

Vue.use(vueCustomElement);

Vue.customElement('widget-vue', {
  props: [
    'prop1',
    'prop2',
    'prop3'
  ],
  data: {
    message: 'Hello Vue!'
  },
  template: '<p>{{ message }}, {{ prop1  }}, {{prop2}}, {{prop3}}</p>'
});

export default (req: NowRequest, res: NowResponse) => {
  const renderer = createRenderer();

  const app = new Vue({
    data: {},
    template: `<div>
      <counter-component customText="foobar" />
      <widget-vue>
        sdaffdas
      </widget-vue>
    </div>`,
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