import Vue from "vue";
import App from "./App.vue";
import Forest from "./forestjs";

Vue.use(Forest);


Vue.config.productionTip = false;
//Vue.use(Forest);

const RainbowComponent = Vue.isoComponent('happy-rainbow', App);

new Vue({
    render: h => h(RainbowComponent)
}).$mount('#app');

