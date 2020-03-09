# ADR: Vue WC Isomorphic Requirements

If one uses the component `my-component` on the client (frontend) then it must be available to the browser as a `customElements`. So there is a prerequisite of having a `customElements.define('my-component', ...)` in the frontend side. 

Using `Vue.component(`my-component`)` therefore is not target-aimed since it would only expose a vue element internally to vue that when rendered is replaced with whatever content of that vue component.

Using the official component wrapper is ALSO not an option since it is not isomorphic. You can already tell by its type of definition:

```
import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'

const Component = {
  // any component options
  data ...,
  props ...,
  template ...,
} // DOES NOT CONTAIN A TAG NAME!

const CustomElement = wrap(Vue, Component); simply returns something that only runs on the client really!

window.customElements.define('my-element', CustomElement)
```


That being said we need to find a solution that allows the following:

A random CMS (drupal, AEM, whatever) plays out the following content:
```
<my-component>
    <my-component>
        Hello encapsulation
    <my-component>
</my-component>
```

The full code should be able to be SSR'ed as well as ran on client side.

The idea is that every component has a specific app prefix e.g.
```
<app-my-component>
    <app-my-component>
        Hello encapsulation
    <app-my-component>
</app-my-component>
```
    
By that logic we would always be able to infer that `app-my-component` corresponds to component `my-component`. However if we define any of those it would not be isomorphic.

Proof 1 (define `app-my-component`):
----

Defining `Vue.component('app-my-component', ...)` will definitely *replace* `<app-my-component>` with its rendering result (because that is how Vue works). Using the `render` function of vue to define the output won't change this since replacing `app-my-component` with itself would lead to a infinite render loop that `Vue` resolves with emptiness.


Proof 2 (define `my-component`):
----

Defining `Vue.component('my-component', ...)` with the given example from above would do nothing since `my-component` is not existent in the string.

## Why do you even need isomorphism and dont just use Puppeteer?

1. Async rendered components especially those with loading state might leave the headless-browser-rendered one with a corrupt state.
2. Some Framework need some identification of SSR (e.g. `data-server-rendered=true`). They are not added when CSR is happening. So we would have to postprocess those (theoretically rather easy).
3. 

If you do use puppeteer for that you could not use `lambda/serverless` since it would always spin up a new chrome which takes too much of time. Instead we would need an idle chrome which just waits to get new html.

Sources:
- https://developers.google.com/web/tools/puppeteer/articles/ssr


## Solution Finding

We showed that we cannot define a web component equally with `customElements` as well as `Vue` since this would not allow us isomorphic code. 

Let's go step by step:

- In general the issue is
