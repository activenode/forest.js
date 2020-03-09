# ADR: WC Isomorphic Requirements for cross-framework usage

If one uses the component `my-component` on the client (frontend) then it must be available to the browser as a `customElements`. So there is a prerequisite of having a `customElements.define('my-component', ...)` in the frontend side. 

Using e.g. `Vue.component(`my-component`)` therefore is not target-aimed since it would only expose a vue element internally to vue that when rendered is replaced with whatever content of that vue component.

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

If you do not believe me then I can tell you that I actually tested that on the server and it does not run - since it is frontend-aimed.


That being said we need to find a solution that allows the following:

A random CMS (drupal, AEM, whatever) plays out the following content:
```
<my-slider>
    <my-component>
        Hello encapsulation
    <my-component>
</my-slider>
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

Defining `Vue.component('my-component', ...)` with the given example from above would do nothing since `my-component` is not existent in the html string.

## Why do you even need isomorphism and dont just use Puppeteer?

1. Async rendered components especially those with loading state might leave the headless-browser-rendered one with a corrupt state.
2. Some Framework need some identification of SSR (e.g. `data-server-rendered=true`). They are not added when CSR is happening. So we would have to postprocess those (theoretically rather easy).
3. How would hydration look like for an element that has children? Since the children would not be easy to identify -> Example:

```jsx
const MyComponent = ( props ) => {
    return (<div>
        foo
        {props.children}
        bar
    </div>)
}

render(<MyComponent>
    <strong>hello</strong>
</MyComponent>)

// would lead to
```
```html

<div>
    foo
    <strong>hello</strong>
    bar
</div>
```

Now how would you hydrate this? You would need:

```
hydrate(<MyComponent>
    <strong>hello</strong>
</MyComponent>)
```

That however is not easy since that would require you to know THAT the child is specifically `<strong>hello</strong>`. Which in FACT you do not know since the only thing you have client side is:

```
<custom-element>
    <div>
        foo
        <strong>hello</strong>
        bar
    </div>
</custom-element>
```

So how would you know upfront which was the rendered child component? You know in your brain by looking at it. But programmatically? You cannot since it is a plain strong tag that cannot be individually identified as the child here. You could render the component without children and then make a diff to the one WITH but that sounds like a costful experiement tbh. 

Let's go one step further and make child components required to identify as a custom element:

```jsx
render(<MyComponent>
    <my-strong>hello</my-strong>
</MyComponent>)
```

could render:
```html
<custom-element>
    <div>
        foo
        <my-strong class="wc-comp">hello</my-strong>
        bar
    </div>
</custom-element>
```

Actually, this is easier to identify. We can query for `.wc-comp` by using `.querySelector('.wc-comp')`. We must not use `querySelectorAll` since we only want the direct child to match.
Now you can take it out, provide it back to the framework as a child.

Sounds good, right? Now you need to know that e.g. React, Vue and other framworks do a `1:1` comparison to hydrate the component which totally makes sense. Or in other words the result you have from the server should match the one on the client.

Now imagine that `my-strong` is a web component that renders this:
```html
<my-strong class="wc-comp">hello</my-strong>
```
to this
```html
<my-strong class="wc-comp"><strong>hello</strong></my-strong>
```

But what we have given initally to the framework (e.g. React) is 
```html
<my-strong class="wc-comp">hello</my-strong>
```

So in the next render cycle (whenever you change ANYTHING in the state) react would potentially find a diff since now it sees
```html
<my-strong class="wc-comp"><strong>hello</strong></my-strong>
```

Most probably react would try to correct it which would lead to a new "old" state and then `my-strong` would trigger again to initialize itself. Does not sound very promising does it? You would basically re-render many sub-web-components all the time over and over again.

This means in other words: Since the components dont know anything from each other they could always (e.g. by interactivity) change their state and therefore dom individually. And suddenly components would go out of sync which is unfixable by the nature of the independency of those components.

> As a side note: Another negative impact with this nesting is that sub-components could trigger themselves already to initialize - as the browser recognizes them (e.g. adding event listeners) and then be moved again (loosing their event listeners) only to be initalized again. However you could try to overcome this with something like an attribute flag...

## What can we do? 
As we have seen copying over initial HTML and then rendering with any dynamic framework is an option that *cannot* be considered because we can neither properly identify the child components nor could we properly communicate to the parent component that a sub-component tree has changed and that this is totally alright without the parent component having DOMTree-diffing issues.

Generically spoken the issue is with having "unknown" precompiled content there which can even be properly server-side-rendered and still be unknown as the match back to the template cannot be processed (as described in all of the text above). Also as a side-effect we are trying to deal with browser-specific lifecycles (`connectedCallback` etc) within lifecycles of different frameworks and all of that potentially infinitely nested.

### Proposal 1 (trivial)

Do not use custom elements within custom elements. By this logic you only have to deal with the top level rendering which should be quite alright since you would not need to identify the child components.
But keep in mind that it is normal to have custom elements nested so this proposal seems as useless as trivial but maybe it fits for you.

tldr for Proposal 1: do not render children (do not use "slots").

### Proposal 2

Nest "3d-party" / other components inside of your component but precompiled. That way you kind of have what is in *Proposal 1* but not with the trivial exclusion of NOT having those child components at all.

Example:

```js
import ChildElement from `3dparty/VueComponent/dist`;

ReactDOM.render(
    <div>
        <ChildElement />
    </div>
)
```

Since this provides a way of React knowing the DomTree this would properly render. On production you could set the `Vue` library then as `external` so that its not bundled all the time.

You can play this game with any framework but it would make the top-most framework the owning one.


### Proposal 3 ShadowDOM

Let us put together the requirements tbd




Sources:
- https://developers.google.com/web/tools/puppeteer/articles/ssr

