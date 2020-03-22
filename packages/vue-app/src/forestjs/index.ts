/* eslint-disable */
import _Vue, { Component } from 'vue';
import { VNode } from 'vue/types/umd';

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

      const innerWrapperClassName = `wc-${tagName}`;
      const WrappedAnonComponent = {
        render (h: Vue.CreateElement) {
          const self = this as unknown as any;
          const $slotsDefault = self.$slots.default;

          return h(
            'div',
            {
              class: innerWrapperClassName
            },
            [h(AnonComponent, {
              attrs: self.$attrs
            }, $slotsDefault || [])], 
          );
        }
      };

      RegistryMap.set(tagName, WrappedAnonComponent);

      if (hasBrowserCapabilities) {
        customElements.define('happy-rainbow', class extends HTMLElement {
          connectedCallback() {
            const app = new Vue({
              render: h => h(WrappedAnonComponent)
            });

            // TODO: need to NOT use querySelector cause it is dangerous
            // we need to filter the DIRECT children instead!

            if (this.querySelector(`.${innerWrapperClassName}`)) {
              console.log('trying to hydrate');
              const hydrationTarget: Element = 
                (this.querySelector(`.${innerWrapperClassName}`) as Element);
              //app.$mount(hydrationTarget, true);
            } else {
              console.log('render fresh!');
              const ghost = document.createElement('div');
              this.appendChild(ghost);
              
              //app.$mount(ghost);
            }
          }
        })
      }


      return {
        render (h: Vue.CreateElement) {
          const self = this as unknown as any;
          const $slotsDefault = self.$slots.default;
          
          return h(
            tagName, 
            {},
            [
              h(WrappedAnonComponent, {
                attrs: self.$attrs
              }, $slotsDefault || [])
            ], 
          );
        }
      } as Component;
    }
  }
}