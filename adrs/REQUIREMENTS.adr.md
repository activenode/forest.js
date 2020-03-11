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

## Finding a workaround against the proofs
Let us take the following example:

Let us take `Vue` as an example here:

```html
<my-comp></my-comp>
```

If we put this to SSR we could do:

```js
Vue.component('my-comp', {
    return createElement(
      'customelement-my-comp', // tag name
      {props: {}},
      [
        createElement(SomeVueComponent, {
          props: {},
        }),
        this.$slots.default,
      ], // array of children
    );
})
```

This would make sure that we are rendering out an actual web component.

So it would turn to


```html
<customelement-my-comp>...</customelement-my-comp>
```

So on your frontend you would need to define  something like

```js
customElements.define('customelement-my-comp', class extends HTMLElement {
    connectedCallback() {
        const Vue = require('Vue');
        const app = new Vue({
            data: context,
            template: `<my-comp />`
        });

        app.$mount(this);
    }
})
```

The above code will lead to an infinite loop as the `my-comp` would render another `customelement-my-comp` which would render another Vue `my-comp` and so on and so forth.

The workaround for this: Do not render the component clientwise that will render itself but render the *anonymous* Vue component on the client:

```js
customElements.define('customelement-my-comp', class extends HTMLElement {
    connectedCallback() {
        const Vue = require('Vue');
        const MyComp = {
            template: whatever,
            ...
        };
        const app = new Vue({
            data: context,
            render (h) {
                return h(MyComp, {
                    props: {...}
                }, slotChildren)
            }
        });

        app.$mount(this);
    }
})
```

So far (without going deeper into all of the use-cases) this would solve the above described issues.

To give you a issue upfront why this is not yet the full-fledged solution:

1. We only have integrated Vue by now
2. If we render `slots` with SSR we loose the context what the actual slots were (further described below) since now we are providing the `slotChildren` but we would need to be able to identify them exactly and take them out of the existing code to put them there. The issue is that since the slot children are web components again they would probably trigger themselves an init process and POTENTIALLY change their html structure (factually rather not since we expect all of them to be in a specific state cause all of them are SSRed). So we would need a way to disallow this. And even then they would at one point go out-of-sync (read further below) and the "parent component" would not be able to properly to the diffing since it is missing the information of the change of the child component.





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

Let us put together the requirements:

- we want to render children that are already defined e.g. `<wc> <children...> </wc>`
- we want to have multiple different frameworks
- we want SSR
- we want web components

This sheer amount of ridicolous requirements can potentially be fulfilled if ShadowDOM is used.

ShadowDOM inherits WebComponents/CustomElements from the same document (so the scoping of ShadowDOM is not an issue for child components).

Let us have a closer look. Let the following be a React component that is rendered within the web component.

```html
<!-- no SSR here yet -->
<wc>
    <children...>
</wc>
```

The React component could look like this:

```html
<div>
    <slot />
</div>
```

Since React does not know the `slot` component it would render within `wc` with the following result.

```html
<!-- CSR -->
<div>
    <slot />
</div>
```

This is actually nice first of all since it helps to keep consistency. The browser does not copy anything over to the slot element. It only references the element that is given to it. See also my mini-sample here https://ycgi8.csb.app/ .

Sample:
```html
<wc>
    <strong id="wuza" class="to-be-slotted"></strong>
</wc>
```

The sample does not really have a nesting yet but we will look at that later.

The sample will turn into the following in the browser (when properly using slots with ShadowDOM):


```html
<wc>
    #shadowDom 🔽
    <div>
        <slot @ref={#wuza}>
            <!-- strong tag is rendered AS IF it was here -->
        </slot>
    </div>
    #shadowDom 🔼

    #lightDom (not visible) 🔽
    <strong id="wuza" class="to-be-slotted">foo</strong>
    #lightDom 🔽
</wc>
```

If you check the `.innerHTML` of the ShadowDOM (`wc.shadowRoot.innerHTML`) it will return this:

```html
<div>
    <slot></slot>
</div>
```

This is totally as expected since the slot is a PLACEHOLDER and the browser does not put the slotted element there. It just references it.
This being said the innerHTML stays consistent 😲🤩 . Cool stuff.

How does that help us in any of the issues from above?

Let's go issue by issue:

1. Nesting
2. SSR with Nesting

### Nesting

Assume this is played by your CMS html-wise:

```html
<wc-slider>
    <wc-slider-elem>
        <img src="test.jpg" />
    </wc-slider-elem>

    <wc-slider-elem>
        <img src="test2.jpg" />
    </wc-slider-elem>
</wc-slider>
```

So first of all everything that we "slotify" must be static. WHY? It is because the "slottable" (anything) html as compared to the actual `slot` (native html element) is SEEN by the framework but the framework expects consistency for the stuff it does not know. By definition ANY dynamic web component can be considered static if it has a ShadowDOM since the outside (browser) perspective doesn't see dynamic changes within the ShadowDOM. If that component is using slots again those slots should be again static. Easy, right? Kinda 🤓

Inside out is easier so lets take `wc-slider-elem`:

```js
// Vue/SliderElem.js
export default {
    template: `
        <div class="slider-elem">
            <slot></slot>
        <div>
    `
}

// main.js
customElements.define('wc-slider-elem', class extends HTMLElement {
    connectedCallback() {
        const SliderElem = require('Vue/SliderElem');

        const innerHTML = this.innerHTML; // <img src="...." />
        this.innerHTML = ''; // cleaning up after read

        const app = new Vue({
            data: {},

            render: function(createElement) {
                return createElement(
                    SliderElem,
                    {props: {}},
                    this.innerHTML
                ),
            }
        });

        app.$mount(this);
    }
});
```

The above example will render from this:

```html
<wc-slider-elem>
    <img src="test2.jpg" />
</wc-slider-elem>
```

to this:
```html
<wc-slider-elem>
    <div class="slider-elem">
        <img src="test2.jpg" />
    <div>
</wc-slider-elem>
```

There is no actual ShadowDOM yet. The `slot` comes from Vue and renders the child elements were the `slot` sits. It is literally a `Vue` feature that has nothing to do with WebComponents/CustomElements (we will get into that in some moments).

This looks good but in fact it is bad: It changed itself - the DOM of that element has changed - which is by definition inconsistent from a view of the parent component.
**Why is that inconsistency bad**?

It is worth to understand how the browser initializes custom elements.
Let's make a quick side quest here:

```
customElements.define('x-faa', class extends HTMLElement {
    connectedCallback() {
        console.log('x-faa triggered');
    }
})

customElements.define('x-foo', class extends HTMLElement {
    connectedCallback() {
        console.log('x-foo triggered');
    }
})

customElements.define('x-bar', class extends HTMLElement {
    connectedCallback() {
        console.log('x-bar triggered');
    }
})


customElements.define('x-boo', class extends HTMLElement {
    connectedCallback() {
        console.log('x-boo triggered');
    }
})

document.body.innerHTML = '<x-foo><x-bar><x-boo></x-boo></x-bar></x-foo><x-faa></x-faa>';
```

Having the above triggers this :

```js
logs >
x-foo triggered
x-bar triggered
x-boo triggered
x-faa triggered
```

So it means that (at least in Chrome) custom elements are initialized inside-out and top-to-bottom. Or tldr: Outside-In-Top-Down.

Now having this it means that the most outside custom element will trigger the initialization first.

This situation is bad. Because if it was inside-out then the most outer element would be able to get all correctly inner-rendered child elements (assuming that they are immediately rendered). However outside-in (which is how the browser does it) means the exact opposite: First the most parent component gets to know the child structure and then afterwards the child structure changes -> inconcistency.

> You could try to overcome this inconistency by building an orchestrator to overcome how the browser initializes but then again I am asking why would you even bother to use CustomElements at all if you are changing their behaviour in their core. Then I would rather "recommend" you to use a MutationObserver and build your own CustomElements than doing this weird side-effect-heavy workaround of orchestration.

It is now very important to understand that even if it was outside-in initialization you would reach a point of inconsistency if the components you are using are affected by ANY kind of state change or user interaction - since that again would cause a change in the DOM and therefore cause an inconistency for the parent component.

Let's get back on track how ShadowDOM will help us by getting the aforementioned code and adapting it a bit.

```js
// Vue/SliderElem.js
export default {
    template: `
        <div class="slider-elem">
            <slot></slot>
        <div>
    `
}

// main.js
customElements.define('wc-slider-elem', class extends HTMLElement {
    connectedCallback() {
        const SliderElem = require('Vue/SliderElem');

        // we do not read the innerHTML anymore, we just LEAVE the innerHTML in the component AS IS
        //const innerHTML = this.innerHTML; // <img src="...." />
        //this.innerHTML = ''; // cleaning up after read

        const app = new Vue({
            data: {},

            render: function(createElement) {
                return createElement(
                    SliderElem,
                    {props: {}}
                ),
            }
        });

        const shadowRoot = this.attachShadow({ mode: 'open' });
        app.$mount(shadowRoot);
    }
});
```

It would render this:
```
<wc-slider-elem>
    <img src="test.jpg" />
</wc-slider-elem>
```

to this:
```
<wc-slider-elem>
    <div></div>
</wc-slider-elem>
```

Whoops. Where did our `img` go? Well since Vue uses the same element (https://vuejs.org/v2/guide/components-slots.html) tag name for their placeholder as the actual HTML slot definition (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) it is quite clear that `Vue` sees the `slot` as a vue placeholder and since we didn't provide it with any data for that placeholder Vue will render it empty.

Since this is a severe issue it is probably clear why Vue actually deprecated `slot` as a tag name in favor of a generic attribute directive `v-slot` (as of version `2.6.0`).

But since it is not yet removed but deprecated you can solve it either via using your own render function or by using the `v-html` directive as follows:

```js
// Vue/SliderElem.js
Vue.component("Slotty", {
  render: createElement => {
    return createElement(
      "slot", // tag name
    );
  }
});

export default {
    template: `
        <div class="slider-elem">
            <Slotty />
        <div>
    `
}

customElements.define('wc-slider-elem', class extends HTMLElement {
    connectedCallback() {
        const SliderElem = require('Vue/SliderElem');

        // we do not read the innerHTML anymore, we just LEAVE the innerHTML in the component AS IS
        //const innerHTML = this.innerHTML; // <img src="...." />
        //this.innerHTML = ''; // cleaning up after read

        const app = new Vue({
            data: {},

            render: function(createElement) {
                return createElement(
                    SliderElem,
                    {props: {}}
                ),
            }
        });

        const shadowRoot = this.attachShadow({ mode: 'open' });
        app.$mount(shadowRoot);
    }
});
```

Now it should render correctly. So it would render this:

```html
<wc-slider-elem>
    <img src="test.jpg" />
</wc-slider-elem>
```

to this:
```html
<wc-slider-elem>
    #shadowDom 🔽
    <div>
        <slot @ref={<img src="test.jpg" />}>
            <!-- img tag is not really here, just a reference -->
        </slot>
    </div>
    #shadowDom 🔼

    #lightDOM 🔽
    <img src="test.jpg" />
    #lightDOM 🔼
</wc-slider-elem>
```

Now this is awesome. Because even if we change the stuff within "lightDOM" the innerHTML inside of the shadowDOM where our framework component is rendered stays consistent ! 🤩‼

Let us nest this for technical reasons (even if it does not make sense in our example).



```html
<wc-slider-elem>
    <wc-slider-elem>
        <img src="test.jpg" />
    </wc-slider-elem>
</wc-slider-elem>
```

This nested example would render to:
```html
<wc-slider-elem>
    #shadowDom 🔽
    <div>
        <slot @ref={<wc-slider-elem ... />}></slot>
    </div>
    #shadowDom 🔼

    #lightDOM 🔽
    <wc-slider-elem>
        #shadowDom 🔽
        <div>
            <slot @ref={<img src="test.jpg" />}></slot>
        </div>
        #shadowDom 🔼

        #lightDOM 🔽
        <img src="test.jpg" />
        #lightDOM 🔼
    </wc-slider-elem>
    #lightDOM 🔼
</wc-slider-elem>
```

As you can see the parent `wc-slider-elem` still has a "consistent" and "static" child even though the child is everything else but "consistent". This is due to the nature of how a `slot` works. So the parent element really only sees the `.innerHTML` `slot` but not the actual referenced HTML. And this works recursively.

So far the point 1 is solved: Nesting with (different) frameworks including web components. Wow, that took a while.

But we did'nt solve yet SSR.





It is crucial to understand what is happening in the above example. We

Should work as it goes.

```js
customElements.define('wc-slider', class extends HTMLElement {
    connectedCallback() {
        const Slider = require('Vue/Slider');

        const app = new Vue({
            data: {},
            render (h) {
                return h(SliderElem, {
                    props: {...},
                    [
                        createElement(Slider, { props: {} }),
                        this.$slots.default,
                    ]
                })
            }
        });

        const shadow = this.attachShadow({ mode: "open" });
        app.$mount(shadow);
    }
});
```

### SSR with Nesting
tbd




Sources:
- https://developers.google.com/web/tools/puppeteer/articles/ssr

