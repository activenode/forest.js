/* eslint-disable */
import _Vue from 'vue';

declare module 'vue/types/vue' {
  export interface VueConstructor   {
      isoComponent: Function;
  }
}

export default {
  install: (Vue: typeof _Vue) => {
    const RegistryMap: Map<string, Vue.Component> = new Map();
    const hasBrowserCapabilities = typeof window !== 'undefined' && typeof HTMLElement !== 'undefined';

    Vue.isoComponent = (tagName: string, AnonComponent: Vue.Component) => {
      if (RegistryMap.has(tagName)) {
        throw new Error(`Cannot redefine ${tagName}`);
      }

      RegistryMap.set(tagName, AnonComponent);

      if (hasBrowserCapabilities) {
        customElements.define('happy-rainbow', class extends HTMLElement {
          connectedCallback() {
            const ghost = document.createElement('div');
            this.appendChild(ghost);
  
            new Vue({
              render: h => h(AnonComponent)
            }).$mount(ghost);
          }
        })
      }
    }
  }
}