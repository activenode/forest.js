import Vue from "vue";
import App from "./App.vue";
import Forest from "./forestjs";

Vue.use(Forest);


Vue.config.productionTip = false;
//Vue.use(Forest);

Vue.isoComponent('happy-rainbow', App);

