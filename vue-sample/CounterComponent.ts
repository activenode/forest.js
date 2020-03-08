import Vue from 'vue';

const ButtonCounter = Vue.component('counter-component', {
    data: function() {
        return {
            count: 0,
        };
    },
    props: ['customText'],
    template: `<div class="counter-component-wrapper-div">
            <button v-on:click="count++">You clicked me {{ count }} times.</button>
            <p>Some Custom Text: <strong>{{ customText }}</strong></p>
            <slot></slot>
        </div>`,
});
